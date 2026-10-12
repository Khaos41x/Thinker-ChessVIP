import threading
import time
from dataclasses import dataclass
from typing import Any, Callable, Protocol


class CoordinatorError(RuntimeError):
    pass


class CoordinatorObsolete(CoordinatorError):
    pass


class CoordinatorDeadlineExceeded(CoordinatorError):
    pass


class EngineAdapter(Protocol):
    @property
    def generation(self) -> str:
        ...

    @property
    def ready(self) -> bool:
        ...

    def stop(self) -> None:
        ...

    def force_restart(self) -> None:
        ...


class CancellationToken:
    def __init__(self):
        self._event = threading.Event()
        self._reason = None

    def cancel(self, reason="cancelled"):
        if not self._event.is_set():
            self._reason = reason
            self._event.set()

    @property
    def cancelled(self):
        return self._event.is_set()

    @property
    def reason(self):
        return self._reason

    def raise_if_cancelled(self):
        if self.cancelled:
            raise CoordinatorObsolete(self.reason or "cancelled")


@dataclass(frozen=True)
class EngineJob:
    request_id: str
    kind: str
    runtime_game_token: str | None = None
    position_revision: int | None = None


@dataclass(frozen=True)
class CoordinatorResult:
    value: Any
    engine_generation: str
    queue_elapsed_ms: int
    total_elapsed_ms: int


@dataclass
class _Admission:
    job: EngineJob
    token: CancellationToken
    owns_lease: bool = False


class EngineCoordinator:
    def __init__(self, adapter: EngineAdapter, *, cancellation_grace_ms=250, monotonic=time.monotonic):
        self.adapter = adapter
        self.cancellation_grace_ms = max(0, int(cancellation_grace_ms))
        self.monotonic = monotonic
        self._engine_lock = threading.Lock()
        self._registry_lock = threading.Lock()
        self._latest_revision = {}
        self._active_by_game = {}
        self._lease_owner = None

    @property
    def generation(self):
        return self.adapter.generation

    @property
    def ready(self):
        return bool(self.adapter.ready)

    def _admit(self, job):
        token = CancellationToken()
        previous = None
        if job.runtime_game_token is None:
            return _Admission(job=job, token=token), previous, False
        if job.position_revision is None or job.position_revision < 0:
            raise ValueError("position_revision is required for game-scoped jobs")
        with self._registry_lock:
            latest = self._latest_revision.get(job.runtime_game_token, -1)
            if job.position_revision < latest:
                raise CoordinatorObsolete("position revision is older than the admitted revision")
            if job.position_revision == latest:
                active = self._active_by_game.get(job.runtime_game_token)
                if active is not None:
                    raise CoordinatorObsolete("position revision already has an active request")
            self._latest_revision[job.runtime_game_token] = job.position_revision
            previous = self._active_by_game.get(job.runtime_game_token)
            if previous is not None and previous.job.request_id != job.request_id:
                previous.token.cancel("superseded by a newer position revision")
            previous_owned_lease = bool(previous and previous.owns_lease)
            admission = _Admission(job=job, token=token)
            self._active_by_game[job.runtime_game_token] = admission
        return admission, previous, previous_owned_lease

    def is_game_active(self, runtime_game_token: str) -> bool:
        with self._registry_lock:
            return runtime_game_token in self._active_by_game

    def _stop_if_owner(self, admission) -> None:
        if admission is None:
            return
        with self._registry_lock:
            if self._lease_owner is not admission:
                return
            try:
                self.adapter.stop()
            except Exception:
                pass

    def release_game(self, runtime_game_token: str) -> None:
        active = None
        with self._registry_lock:
            self._latest_revision.pop(runtime_game_token, None)
            active = self._active_by_game.pop(runtime_game_token, None)
            if active is not None:
                active.token.cancel("game released")
        self._stop_if_owner(active)

    def _acquire(self, deadline, previous_owner):
        remaining = deadline - self.monotonic()
        if remaining <= 0:
            raise CoordinatorDeadlineExceeded("deadline expired before engine admission")
        if previous_owner is None:
            if not self._engine_lock.acquire(timeout=remaining):
                raise CoordinatorDeadlineExceeded("deadline expired in engine queue")
            return
        grace_seconds = min(remaining, self.cancellation_grace_ms / 1000)
        if self._engine_lock.acquire(timeout=grace_seconds):
            return
        with self._registry_lock:
            if self._lease_owner is previous_owner:
                self.adapter.force_restart()
        remaining = deadline - self.monotonic()
        if remaining <= 0 or not self._engine_lock.acquire(timeout=remaining):
            raise CoordinatorDeadlineExceeded("obsolete engine work exceeded cancellation grace")

    def run_transaction(self, job: EngineJob, client_budget_ms: int, operation: Callable):
        started = self.monotonic()
        budget_ms = max(1, min(60_000, int(client_budget_ms)))
        deadline = started + budget_ms / 1000
        admission, previous, previous_owned_lease = self._admit(job)
        if previous_owned_lease:
            self._stop_if_owner(previous)
        acquired = False
        try:
            self._acquire(deadline, previous if previous_owned_lease else None)
            acquired = True
            with self._registry_lock:
                admission.owns_lease = True
                self._lease_owner = admission
            admitted_at = self.monotonic()
            admission.token.raise_if_cancelled()
            if admitted_at >= deadline:
                raise CoordinatorDeadlineExceeded("deadline expired before engine operation")
            value = operation(self.adapter, deadline, admission.token)
            admission.token.raise_if_cancelled()
            finished = self.monotonic()
            if finished > deadline:
                raise CoordinatorDeadlineExceeded("engine operation exceeded deadline")
            return CoordinatorResult(
                value=value,
                engine_generation=self.adapter.generation,
                queue_elapsed_ms=max(0, round((admitted_at - started) * 1000)),
                total_elapsed_ms=max(0, round((finished - started) * 1000)),
            )
        finally:
            if acquired:
                with self._registry_lock:
                    admission.owns_lease = False
                    if self._lease_owner is admission:
                        self._lease_owner = None
                self._engine_lock.release()
            if job.runtime_game_token is not None:
                with self._registry_lock:
                    current = self._active_by_game.get(job.runtime_game_token)
                    if current is admission:
                        self._active_by_game.pop(job.runtime_game_token, None)

    def run(self, job: EngineJob, client_budget_ms: int, operation: Callable):
        return self.run_transaction(job, client_budget_ms, operation)
