from __future__ import annotations

import collections
import hashlib
import logging
import threading
import time
from dataclasses import dataclass
from enum import Enum

from core.elo_calibration import CalibrationRequest, EloCalibrator, EngineProfile, NoopEngineTelemetry, Side


class CalibrationMode(str, Enum):
    SHADOW = "shadow"
    CANARY = "canary"
    ACTIVE = "active"


@dataclass(frozen=True, slots=True)
class RolloutPolicy:
    mode: CalibrationMode = CalibrationMode.SHADOW
    canary_basis_points: int = 0
    explicit_keys: frozenset[str] = frozenset()
    version: str = "canary-sha256-v1"

    def __post_init__(self) -> None:
        if not isinstance(self.mode, CalibrationMode):
            raise ValueError("mode must be a CalibrationMode")
        if not isinstance(self.canary_basis_points, int) or isinstance(self.canary_basis_points, bool):
            raise ValueError("canary_basis_points must be an integer")
        if not 0 <= self.canary_basis_points <= 10_000:
            raise ValueError("canary_basis_points must be between 0 and 10000")
        if not isinstance(self.explicit_keys, frozenset):
            raise ValueError("explicit_keys must be a frozenset")
        if len(self.explicit_keys) > 256:
            raise ValueError("explicit_keys cannot exceed 256 entries")
        if any(not isinstance(key, str) or not key or len(key) > 128 for key in self.explicit_keys):
            raise ValueError("explicit_keys must contain non-empty values up to 128 characters")
        if not isinstance(self.version, str) or not self.version or len(self.version) > 64:
            raise ValueError("version must contain between 1 and 64 characters")

    def resolve(self, runtime_game_token: str, artifact_checksum: str) -> tuple[CalibrationMode, str]:
        if self.mode is CalibrationMode.SHADOW:
            return CalibrationMode.SHADOW, "shadow"
        if self.mode is CalibrationMode.ACTIVE:
            return CalibrationMode.ACTIVE, "active"
        if runtime_game_token in self.explicit_keys:
            return CalibrationMode.ACTIVE, "canary"
        payload = b"".join(
            len(value).to_bytes(4, "big") + value
            for value in (
                self.version.encode("utf-8"),
                artifact_checksum.encode("ascii"),
                runtime_game_token.encode("utf-8"),
            )
        )
        sample = int.from_bytes(hashlib.sha256(payload).digest()[:8], "big")
        selected = sample * 10_000 < self.canary_basis_points * (1 << 64)
        return (
            (CalibrationMode.ACTIVE, "canary")
            if selected
            else (CalibrationMode.SHADOW, "control")
        )


@dataclass(frozen=True, slots=True)
class CalibrationDecision:
    mode: CalibrationMode
    status: str
    reason: str | None
    profile: EngineProfile | None
    pinned: bool
    resolver_version: str | None = None
    attempted_identity: tuple[tuple[str, object], ...] = ()
    cohort: str = "shadow"
    rollout_version: str = "canary-sha256-v1"

    @property
    def executes_v2(self) -> bool:
        return self.mode is CalibrationMode.ACTIVE and self.profile is not None

    def identity(self) -> dict[str, object]:
        profile = self.profile
        if profile is None:
            identity = {
                "calibrationMode": self.mode.value,
                "calibrationStatus": self.status,
                "calibrationReason": self.reason,
                "calibrationCohort": self.cohort,
                "rolloutVersion": self.rollout_version,
            }
            identity.update(dict(self.attempted_identity))
            return identity
        return {
            "calibrationMode": self.mode.value,
            "calibrationStatus": self.status,
            "calibrationReason": self.reason,
            "calibrationCohort": self.cohort,
            "rolloutVersion": self.rollout_version,
            "scaleId": profile.scale_id,
            "artifactVersion": profile.artifact_version,
            "artifactChecksum": profile.artifact_checksum,
            "budgetClass": profile.budget_class,
            "seedPolicyVersion": profile.seed_policy_version,
            "resolverVersion": self.resolver_version,
            "latentSkill": profile.latent_skill,
            "appliedSkill": profile.applied_skill,
            "resolutionKey": profile.resolution_key,
            "profileDigest": profile.profile_digest,
            "targetElo": profile.target_elo,
        }


@dataclass(frozen=True, slots=True)
class _PinnedProfile:
    profile: EngineProfile
    last_seen: float
    mode: CalibrationMode
    cohort: str


@dataclass(frozen=True, slots=True)
class _PinnedCohort:
    mode: CalibrationMode
    cohort: str
    rollout_version: str
    last_seen: float
    denied: bool = False


class CalibrationRuntime:
    def __init__(
        self,
        calibrator: EloCalibrator | None,
        *,
        mode: CalibrationMode = CalibrationMode.SHADOW,
        default_scale_id: str | None = None,
        budget_class: str | None = None,
        capacity: int = 2048,
        logger: logging.Logger | None = None,
        unavailable_reason: str = "CALIBRATION_ARTIFACT_UNAVAILABLE",
        pin_ttl_seconds: float = 86400.0,
        monotonic=time.monotonic,
        active_game_predicate=None,
        rollout_policy: RolloutPolicy | None = None,
        telemetry=None,
    ) -> None:
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        self.calibrator = calibrator
        self.mode = mode
        self.rollout_policy = rollout_policy or RolloutPolicy(mode=mode)
        self.telemetry = telemetry or NoopEngineTelemetry()
        self.default_scale_id = default_scale_id
        self.budget_class = budget_class
        self.capacity = capacity
        self.cohort_capacity = capacity * 2
        self.logger = logger or logging.getLogger(__name__)
        self.unavailable_reason = unavailable_reason
        if pin_ttl_seconds <= 0:
            raise ValueError("pin_ttl_seconds must be positive")
        self.pin_ttl_seconds = float(pin_ttl_seconds)
        self.monotonic = monotonic
        self.active_game_predicate = active_game_predicate or (lambda _token: False)
        if calibrator is None:
            self.resolver_version = None
            self.attempted_identity = ()
        else:
            payload = calibrator.artifact.payload
            self.resolver_version = (
                f"pchip-v1:{payload.inverse_convention}:"
                f"{payload.numeric_serialization_version}"
            )
            self.attempted_identity = tuple(
                sorted(
                    {
                        "scaleId": default_scale_id or payload.scale.scale_id,
                        "artifactVersion": payload.artifact_version,
                        "artifactChecksum": calibrator.artifact.checksum,
                        "budgetClass": budget_class or payload.search_policy.budget_class,
                        "seedPolicyVersion": payload.seed_policy_version,
                        "resolverVersion": self.resolver_version,
                    }.items()
                )
            )
        self._pins: collections.OrderedDict[tuple[str, Side], _PinnedProfile] = collections.OrderedDict()
        self._cohorts: collections.OrderedDict[str, _PinnedCohort] = collections.OrderedDict()
        self._capacity_latched = False
        self._lock = threading.Lock()

    def _decision(
        self,
        status,
        reason,
        profile,
        pinned,
        *,
        mode=None,
        cohort=None,
        rollout_version=None,
    ):
        effective_mode = mode or self.mode
        return CalibrationDecision(
            effective_mode,
            status,
            reason,
            profile,
            pinned,
            self.resolver_version,
            self.attempted_identity,
            cohort or effective_mode.value,
            rollout_version or self.rollout_policy.version,
        )

    def release_game(self, runtime_game_token: str) -> None:
        with self._lock:
            keys = [key for key in self._pins if key[0] == runtime_game_token]
            for key in keys:
                self._pins.pop(key, None)
            self._cohorts.pop(runtime_game_token, None)

    def resolve(self, *, target_elo: int, runtime_game_token: str, side: Side) -> CalibrationDecision:
        key = (runtime_game_token, side)
        now = self.monotonic()
        with self._lock:
            pinned = self._pins.get(key)
            if pinned is not None:
                self._pins[key] = _PinnedProfile(pinned.profile, now, pinned.mode, pinned.cohort)
                self._pins.move_to_end(key)
                cohort_pin = self._cohorts.get(runtime_game_token)
                rollout_version = self.rollout_policy.version
                if cohort_pin is not None:
                    rollout_version = cohort_pin.rollout_version
                    self._cohorts[runtime_game_token] = _PinnedCohort(
                        cohort_pin.mode,
                        cohort_pin.cohort,
                        cohort_pin.rollout_version,
                        now,
                        cohort_pin.denied,
                    )
                    self._cohorts.move_to_end(runtime_game_token)
                return self._decision(
                    "proposed",
                    None,
                    pinned.profile,
                    True,
                    mode=pinned.mode,
                    cohort=pinned.cohort,
                    rollout_version=rollout_version,
                )
        artifact_checksum = self.calibrator.artifact.checksum if self.calibrator is not None else "unavailable"
        policy = self.rollout_policy
        effective_mode, cohort = policy.resolve(runtime_game_token, artifact_checksum)
        if self.calibrator is None and policy.mode is CalibrationMode.CANARY:
            effective_mode, cohort = CalibrationMode.SHADOW, "control"
        rollout_version = policy.version
        cohort_denied = False
        capacity_latched = False
        with self._lock:
            cohort_pin = self._cohorts.get(runtime_game_token)
            if cohort_pin is not None:
                effective_mode = cohort_pin.mode
                cohort = cohort_pin.cohort
                rollout_version = cohort_pin.rollout_version
                cohort_denied = cohort_pin.denied
                self._cohorts[runtime_game_token] = _PinnedCohort(
                    effective_mode,
                    cohort,
                    rollout_version,
                    now,
                    cohort_pin.denied,
                )
                self._cohorts.move_to_end(runtime_game_token)
            elif self._capacity_latched:
                effective_mode = CalibrationMode.SHADOW
                cohort = "capacity_guard"
            else:
                if len(self._cohorts) >= self.cohort_capacity:
                    self._capacity_latched = True
                    effective_mode = CalibrationMode.SHADOW
                    cohort = "capacity_guard"
                else:
                    self._cohorts[runtime_game_token] = _PinnedCohort(
                        effective_mode,
                        cohort,
                        rollout_version,
                        now,
                    )
                    self._cohorts.move_to_end(runtime_game_token)
            capacity_latched = self._capacity_latched
        if cohort == "capacity_guard" or capacity_latched or cohort_denied:
            self.telemetry.record_failure("capacity")
            self.telemetry.record_degraded("not_applied")
            return self._decision(
                "not_applied",
                "CALIBRATION_PIN_CAPACITY_EXHAUSTED",
                None,
                False,
                mode=effective_mode,
                cohort=cohort,
                rollout_version=rollout_version,
            )
        if self.calibrator is None:
            return self._decision(
                "not_applied",
                self.unavailable_reason,
                None,
                False,
                mode=effective_mode,
                cohort=cohort,
                rollout_version=rollout_version,
            )
        payload = self.calibrator.artifact.payload
        scale_id = self.default_scale_id or payload.scale.scale_id
        budget_class = self.budget_class or payload.search_policy.budget_class
        try:
            profile = self.calibrator.interpolate_uci_params(
                CalibrationRequest(target_elo, scale_id, budget_class, runtime_game_token, side)
            )
        except Exception as error:
            self.telemetry.record_failure("configuration")
            self.logger.warning(
                "elo_profile_not_applied",
                extra={"reason": type(error).__name__, "mode": self.mode.value},
            )
            return self._decision(
                "not_applied",
                f"CALIBRATION_{type(error).__name__.upper()}",
                None,
                False,
                mode=effective_mode,
                cohort=cohort,
                rollout_version=rollout_version,
            )
        with self._lock:
            existing = self._pins.get(key)
            if existing is not None:
                self._pins[key] = _PinnedProfile(
                    existing.profile,
                    now,
                    existing.mode,
                    existing.cohort,
                )
                self._pins.move_to_end(key)
                profile = existing.profile
                effective_mode = existing.mode
                cohort = existing.cohort
                was_pinned = True
            else:
                if len(self._pins) >= self.capacity:
                    expired = [
                        pin_key
                        for pin_key, pin in self._pins.items()
                        if now - pin.last_seen >= self.pin_ttl_seconds
                        and pin.cohort == "shadow"
                        and not self.active_game_predicate(pin_key[0])
                    ]
                    for pin_key in expired:
                        self._pins.pop(pin_key, None)
                if len(self._pins) >= self.capacity:
                    if effective_mode is CalibrationMode.ACTIVE:
                        cohort_pin = self._cohorts.get(runtime_game_token)
                        if cohort_pin is not None:
                            self._cohorts[runtime_game_token] = _PinnedCohort(
                                cohort_pin.mode,
                                cohort_pin.cohort,
                                cohort_pin.rollout_version,
                                now,
                                True,
                            )
                    self.telemetry.record_failure("capacity")
                    self.telemetry.record_degraded("not_applied")
                    return self._decision(
                        "not_applied",
                        "CALIBRATION_PIN_CAPACITY_EXHAUSTED",
                        None,
                        False,
                        mode=effective_mode,
                        cohort=cohort,
                        rollout_version=rollout_version,
                    )
                self._pins[key] = _PinnedProfile(profile, now, effective_mode, cohort)
                self._pins.move_to_end(key)
                was_pinned = False
        decision = self._decision(
            "proposed",
            None,
            profile,
            was_pinned,
            mode=effective_mode,
            cohort=cohort,
            rollout_version=rollout_version,
        )
        self.logger.info(
            "elo_profile_proposed",
            extra=decision.identity(),
        )
        return decision
