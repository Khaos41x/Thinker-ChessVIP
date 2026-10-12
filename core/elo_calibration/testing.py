from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Any, Iterable, Mapping

from .errors import InjectedUciFailure, UciContractError
from .models import EngineProfile, ScriptedSearchResult, SearchLimit


_ALLOWED_OPTIONS = frozenset({"Threads", "Hash", "MultiPV", "Ponder", "Skill"})


@dataclass(frozen=True, slots=True)
class UciEvent:
    generation: int
    operation: str
    detail: tuple[tuple[str, Any], ...] = ()


class FakeUciEngine:
    def __init__(self, results: Iterable[ScriptedSearchResult] = ()) -> None:
        validated_results = tuple(results)
        if not all(isinstance(result, ScriptedSearchResult) for result in validated_results):
            raise UciContractError("scripted results must be ScriptedSearchResult values")
        self.generation = 1
        self.desired_options: dict[str, Any] = {}
        self.applied_options: dict[str, Any] = {}
        self.events: list[UciEvent] = []
        self.warm = False
        self.searching = False
        self._cleared = False
        self._ready = False
        self._expected_time_ms: int | None = None
        self._results = deque(validated_results)
        self._failures: dict[str, int] = defaultdict(int)

    def inject_failure(self, operation: str, count: int = 1) -> None:
        if count <= 0:
            raise ValueError("count must be positive")
        self._failures[operation] += count

    def apply_profile(self, profile: EngineProfile) -> None:
        self.apply_options(dict(profile.uci_options))
        self._expected_time_ms = profile.move_time_ms

    def apply_options(self, options: Mapping[str, Any]) -> None:
        self._check_idle()
        unknown = set(options) - _ALLOWED_OPTIONS
        if unknown:
            raise UciContractError(f"unsupported UCI options: {sorted(unknown)}")
        if set(options) != _ALLOWED_OPTIONS:
            raise UciContractError("profile must specify the complete UCI allowlist")
        skill = options["Skill"]
        if isinstance(skill, bool) or not isinstance(skill, int) or not 0 <= skill <= 25:
            raise UciContractError("Skill must be an integer in [0, 25]")
        for name in ("Threads", "Hash", "MultiPV"):
            value = options[name]
            if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
                raise UciContractError(f"{name} must be a positive integer")
        if options["MultiPV"] != 1:
            raise UciContractError("MultiPV must equal 1")
        if not isinstance(options["Ponder"], bool):
            raise UciContractError("Ponder must be boolean")
        self._maybe_fail("apply_options")
        self.desired_options = dict(options)
        self._ready = False
        self._cleared = False
        self._expected_time_ms = None
        self.events.append(
            UciEvent(self.generation, "apply_options", tuple(sorted(options.items())))
        )

    def clear_hash(self) -> None:
        self._check_idle()
        self._maybe_fail("clear_hash")
        self.warm = False
        self._cleared = True
        self._ready = False
        self.events.append(UciEvent(self.generation, "clear_hash"))

    def isready(self) -> None:
        self._check_idle()
        self._maybe_fail("isready")
        if not self._cleared:
            raise UciContractError("Clear Hash must precede isready")
        self.applied_options = dict(self.desired_options)
        self._ready = True
        self.events.append(UciEvent(self.generation, "isready"))

    def search(self, limit: SearchLimit) -> ScriptedSearchResult:
        self._check_idle()
        if not self._cleared or not self._ready:
            raise UciContractError("Clear Hash and isready must precede every search")
        if self.desired_options != self.applied_options:
            raise UciContractError("desired/applied UCI state mismatch")
        if set(self.applied_options) != _ALLOWED_OPTIONS or self._expected_time_ms is None:
            raise UciContractError("a complete EngineProfile must be applied before search")
        if self.warm:
            raise UciContractError("warm state leaked into a new search")
        if not isinstance(limit, SearchLimit):
            raise UciContractError("search requires a validated SearchLimit")
        if limit.time_ms != self._expected_time_ms:
            raise UciContractError("search limit must match the calibrated profile")
        self._maybe_fail("search")
        if not self._results:
            raise UciContractError("no scripted search result remains")
        self.searching = True
        result = self._results.popleft()
        self.events.append(
            UciEvent(
                self.generation,
                "search",
                (("timeMs", limit.time_ms), ("bestMove", result.best_move)),
            )
        )
        self.searching = False
        self.warm = True
        self._cleared = False
        self._ready = False
        return result

    def restart(self) -> None:
        self._check_idle()
        self._maybe_fail("restart")
        self.generation += 1
        self.desired_options = {}
        self.applied_options = {}
        self.warm = False
        self.searching = False
        self._cleared = False
        self._ready = False
        self._expected_time_ms = None
        self.events.append(UciEvent(self.generation, "restart"))

    def _check_idle(self) -> None:
        if self.searching:
            raise UciContractError("engine mutation is forbidden while searching")

    def _maybe_fail(self, operation: str) -> None:
        if self._failures[operation] > 0:
            self._failures[operation] -= 1
            self.events.append(UciEvent(self.generation, f"{operation}_failed"))
            raise InjectedUciFailure(operation)
