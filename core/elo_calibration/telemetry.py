from __future__ import annotations

import logging
import math
import threading
from collections.abc import Callable

from prometheus_client import CollectorRegistry, Counter, Gauge, Histogram, Info, generate_latest
from prometheus_client.exposition import CONTENT_TYPE_LATEST


TARGET_ELO_BUCKETS = (600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200)
APPLIED_SKILL_BUCKETS = tuple(value - 0.5 for value in range(27))
SEARCH_DURATION_BUCKETS = (0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10)
STAGES = frozenset({"reference_shallow", "selector_v1", "selector_v2", "reference_deep", "legacy", "unknown"})
STATUSES = frozenset({"ok", "error", "timeout", "cancelled", "shadow", "applied", "not_applied", "fallback", "partial", "ready", "degraded", "unknown"})
FAILURES = frozenset({"invalid_artifact", "profile_apply", "search", "restore", "coordinator", "configuration", "capacity", "unknown"})


class EngineTelemetry:
    content_type = CONTENT_TYPE_LATEST

    def __init__(
        self,
        registry: CollectorRegistry | None = None,
        logger: logging.Logger | None = None,
        slots: tuple[str, ...] = ("0",),
    ) -> None:
        if not slots or len(slots) > 32 or any(not str(slot) for slot in slots):
            raise ValueError("slots must contain between 1 and 32 stable identifiers")
        self.registry = registry or CollectorRegistry(auto_describe=True)
        self.logger = logger or logging.getLogger(__name__)
        self._slots = frozenset(str(slot) for slot in slots)
        self._scale_id: str | None = None
        self._scale_lock = threading.Lock()
        self.search_nodes = Counter(
            "thinker_engine_search_nodes_total",
            "Nodes reported by completed engine searches with timing data.",
            ("slot", "stage", "status"),
            registry=self.registry,
        )
        self.search_seconds = Counter(
            "thinker_engine_search_seconds_total",
            "Engine seconds reported by the same searches as the node counter.",
            ("slot", "stage", "status"),
            registry=self.registry,
        )
        self.search_duration = Histogram(
            "thinker_engine_search_duration_seconds",
            "Wall duration of engine searches.",
            ("slot", "stage", "status"),
            buckets=SEARCH_DURATION_BUCKETS,
            registry=self.registry,
        )
        self.target_elo = Histogram(
            "thinker_engine_target_elo",
            "Target Elo distribution for completed calibrated decisions.",
            ("scaleId", "status"),
            buckets=TARGET_ELO_BUCKETS,
            registry=self.registry,
        )
        self.applied_skill = Histogram(
            "thinker_engine_applied_skill",
            "Applied Skill distribution for completed calibrated decisions.",
            ("scaleId", "status"),
            buckets=APPLIED_SKILL_BUCKETS,
            registry=self.registry,
        )
        self.failures = Counter(
            "thinker_engine_failures_total",
            "Bounded engine and calibration failures.",
            ("status",),
            registry=self.registry,
        )
        self.timeouts = Counter(
            "thinker_engine_timeouts_total",
            "Engine operation timeouts by bounded stage.",
            ("stage",),
            registry=self.registry,
        )
        self.clamps = Counter(
            "thinker_engine_clamps_total",
            "Input clamps by bounded category.",
            ("status",),
            registry=self.registry,
        )
        self.restarts = Counter(
            "thinker_engine_restarts_total",
            "Engine restarts by bounded reason.",
            ("status",),
            registry=self.registry,
        )
        self.degraded = Counter(
            "thinker_engine_degraded_mode_total",
            "Requests completed in a degraded mode.",
            ("status",),
            registry=self.registry,
        )
        self.slot_target = Gauge(
            "thinker_engine_slot_target_elo",
            "Current target Elo for a bounded engine slot.",
            ("slot",),
            registry=self.registry,
        )
        self.slot_skill = Gauge(
            "thinker_engine_slot_applied_skill",
            "Current applied Skill for a bounded engine slot.",
            ("slot",),
            registry=self.registry,
        )
        self.slot_active = Gauge(
            "thinker_engine_slot_active",
            "Whether a bounded engine slot currently owns a lease.",
            ("slot",),
            registry=self.registry,
        )
        self.engine_status = Gauge(
            "thinker_engine_status",
            "Current engine status as a one-hot bounded gauge.",
            ("status",),
            registry=self.registry,
        )
        self.calibration_info = Info(
            "thinker_engine_calibration",
            "Identity of the currently configured calibration artifact.",
            registry=self.registry,
        )
        self._current_status: str | None = None
        self._status_lock = threading.Lock()

    def _attempt(self, callback: Callable[[], None]) -> None:
        try:
            callback()
        except Exception as error:
            self.logger.warning("engine_telemetry_failed", extra={"errorType": type(error).__name__})

    @staticmethod
    def _bounded(value: str, allowed: frozenset[str]) -> str:
        normalized = str(value).strip().casefold()
        return normalized if normalized in allowed else "unknown"

    def record_search(
        self,
        *,
        slot: str,
        stage: str,
        status: str,
        duration_seconds: float,
        nodes: int | None = None,
        engine_seconds: float | None = None,
    ) -> None:
        bounded_stage = self._bounded(stage, STAGES)
        bounded_status = self._bounded(status, STATUSES)

        bounded_slot = str(slot) if str(slot) in self._slots else "unknown"

        def update() -> None:
            labels = {"slot": bounded_slot, "stage": bounded_stage, "status": bounded_status}
            duration = float(duration_seconds)
            self.search_duration.labels(**labels).observe(max(0.0, duration) if math.isfinite(duration) else 0.0)
            seconds = float(engine_seconds) if engine_seconds is not None else 0.0
            if isinstance(nodes, int) and not isinstance(nodes, bool) and nodes >= 0 and math.isfinite(seconds) and seconds > 0:
                self.search_nodes.labels(**labels).inc(nodes)
                self.search_seconds.labels(**labels).inc(seconds)

        self._attempt(update)

    def observe_selection(self, *, target_elo: int, applied_skill: int, scale_id: str, status: str) -> None:
        bounded_status = self._bounded(status, STATUSES)
        with self._scale_lock:
            bounded_scale = str(scale_id) if str(scale_id) == self._scale_id else "unknown"
        self._attempt(lambda: self.target_elo.labels(scaleId=bounded_scale, status=bounded_status).observe(target_elo))
        self._attempt(lambda: self.applied_skill.labels(scaleId=bounded_scale, status=bounded_status).observe(applied_skill))

    def begin_slot(self, *, slot: str, target_elo: int | None, applied_skill: int | None) -> None:
        bounded_slot = str(slot) if str(slot) in self._slots else "unknown"

        def update() -> None:
            self.slot_active.labels(slot=bounded_slot).set(1)
            self.slot_target.labels(slot=bounded_slot).set(float(target_elo or 0))
            self.slot_skill.labels(slot=bounded_slot).set(float(applied_skill or 0))

        self._attempt(update)

    def end_slot(self, *, slot: str) -> None:
        bounded_slot = str(slot) if str(slot) in self._slots else "unknown"

        def update() -> None:
            self.slot_active.labels(slot=bounded_slot).set(0)
            self.slot_target.labels(slot=bounded_slot).set(0)
            self.slot_skill.labels(slot=bounded_slot).set(0)

        self._attempt(update)

    def record_failure(self, status: str) -> None:
        bounded = self._bounded(status, FAILURES)
        self._attempt(lambda: self.failures.labels(status=bounded).inc())

    def record_timeout(self, stage: str) -> None:
        bounded = self._bounded(stage, STAGES)
        self._attempt(lambda: self.timeouts.labels(stage=bounded).inc())

    def record_clamp(self, status: str = "unknown") -> None:
        bounded = self._bounded(status, frozenset({"move_selection_elo", "perception_elo", "unknown"}))
        self._attempt(lambda: self.clamps.labels(status=bounded).inc())

    def record_restart(self, status: str = "unknown") -> None:
        bounded = self._bounded(status, frozenset({"superseded", "uncertain_state", "engine_failure", "unknown"}))
        self._attempt(lambda: self.restarts.labels(status=bounded).inc())

    def record_degraded(self, status: str = "fallback") -> None:
        bounded = self._bounded(status, STATUSES)
        self._attempt(lambda: self.degraded.labels(status=bounded).inc())

    def set_engine_status(self, status: str) -> None:
        bounded = self._bounded(status, frozenset({"ready", "degraded"}))

        def update() -> None:
            with self._status_lock:
                if self._current_status is not None:
                    self.engine_status.labels(status=self._current_status).set(0)
                self.engine_status.labels(status=bounded).set(1)
                self._current_status = bounded

        self._attempt(update)

    def set_artifact(self, *, version: str, scale_id: str, budget_class: str) -> None:
        with self._scale_lock:
            if self._scale_id is None:
                self._scale_id = str(scale_id)
        self._attempt(
            lambda: self.calibration_info.info(
                {
                    "version": str(version),
                    "scaleId": str(scale_id),
                    "budgetClass": str(budget_class),
                }
            )
        )

    def render(self) -> bytes:
        return generate_latest(self.registry)


class NoopEngineTelemetry:
    content_type = CONTENT_TYPE_LATEST

    def __getattr__(self, _name):
        return lambda *args, **kwargs: None

    def render(self) -> bytes:
        return b""
