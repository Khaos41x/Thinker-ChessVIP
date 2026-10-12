from __future__ import annotations

import collections
import logging
import threading
import time
from dataclasses import dataclass
from enum import Enum

from core.elo_calibration import CalibrationRequest, EloCalibrator, EngineProfile, Side


class CalibrationMode(str, Enum):
    SHADOW = "shadow"
    ACTIVE = "active"


@dataclass(frozen=True, slots=True)
class CalibrationDecision:
    mode: CalibrationMode
    status: str
    reason: str | None
    profile: EngineProfile | None
    pinned: bool
    resolver_version: str | None = None
    attempted_identity: tuple[tuple[str, object], ...] = ()

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
            }
            identity.update(dict(self.attempted_identity))
            return identity
        return {
            "calibrationMode": self.mode.value,
            "calibrationStatus": self.status,
            "calibrationReason": self.reason,
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
    ) -> None:
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        self.calibrator = calibrator
        self.mode = mode
        self.default_scale_id = default_scale_id
        self.budget_class = budget_class
        self.capacity = capacity
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
        self._lock = threading.Lock()

    def _decision(self, status, reason, profile, pinned):
        return CalibrationDecision(
            self.mode,
            status,
            reason,
            profile,
            pinned,
            self.resolver_version,
            self.attempted_identity,
        )

    def release_game(self, runtime_game_token: str) -> None:
        with self._lock:
            keys = [key for key in self._pins if key[0] == runtime_game_token]
            for key in keys:
                self._pins.pop(key, None)

    def resolve(self, *, target_elo: int, runtime_game_token: str, side: Side) -> CalibrationDecision:
        key = (runtime_game_token, side)
        now = self.monotonic()
        with self._lock:
            pinned = self._pins.get(key)
            if pinned is not None:
                self._pins[key] = _PinnedProfile(pinned.profile, now)
                self._pins.move_to_end(key)
                return self._decision("proposed", None, pinned.profile, True)
        if self.calibrator is None:
            return self._decision("not_applied", self.unavailable_reason, None, False)
        payload = self.calibrator.artifact.payload
        scale_id = self.default_scale_id or payload.scale.scale_id
        budget_class = self.budget_class or payload.search_policy.budget_class
        try:
            profile = self.calibrator.interpolate_uci_params(
                CalibrationRequest(target_elo, scale_id, budget_class, runtime_game_token, side)
            )
        except Exception as error:
            self.logger.warning(
                "elo_profile_not_applied",
                extra={"reason": type(error).__name__, "mode": self.mode.value},
            )
            return self._decision(
                "not_applied",
                f"CALIBRATION_{type(error).__name__.upper()}",
                None,
                False,
            )
        with self._lock:
            existing = self._pins.get(key)
            if existing is not None:
                self._pins[key] = _PinnedProfile(existing.profile, now)
                self._pins.move_to_end(key)
                profile = existing.profile
                was_pinned = True
            else:
                if len(self._pins) >= self.capacity:
                    expired = [
                        pin_key
                        for pin_key, pin in self._pins.items()
                        if now - pin.last_seen >= self.pin_ttl_seconds
                        and not self.active_game_predicate(pin_key[0])
                    ]
                    for pin_key in expired:
                        self._pins.pop(pin_key, None)
                if len(self._pins) >= self.capacity:
                    return self._decision(
                        "not_applied",
                        "CALIBRATION_PIN_CAPACITY_EXHAUSTED",
                        None,
                        False,
                    )
                self._pins[key] = _PinnedProfile(profile, now)
                self._pins.move_to_end(key)
                was_pinned = False
        decision = self._decision("proposed", None, profile, was_pinned)
        self.logger.info(
            "elo_profile_proposed",
            extra=decision.identity(),
        )
        return decision
