import time

import chess
import chess.engine

from core.elo_calibration import EngineProfile


class ProfileTransitionError(RuntimeError):
    pass


class KomodoEngineAdapter:
    def __init__(self, komodo, *, monotonic=time.monotonic):
        self.komodo = komodo
        self.monotonic = monotonic
        self._applied_profile = None
        self._applied_generation = None

    @staticmethod
    def legacy_skill_for_elo(elo):
        return max(0, min(25, int((int(elo) - 800) / 120)))

    @staticmethod
    def _reference_options():
        return {"Threads": 1, "Hash": 128, "Ponder": False, "Skill": 20}

    def _terminate_uncertain(self):
        self._applied_profile = None
        self._applied_generation = None
        try:
            self.komodo.force_terminate()
        except Exception:
            pass

    def _apply_cold_profile(self, name, options, token, deadline=None):
        desired = (name, tuple(sorted(options.items())))
        try:
            token.raise_if_cancelled()
            if deadline is not None and self.monotonic() >= deadline:
                raise TimeoutError(f"deadline expired before {name} transition")
            configurable = {
                key: value
                for key, value in options.items()
                if key not in {"MultiPV", "Ponder"}
            }
            if options.get("Ponder", False) is not False:
                raise ValueError("Ponder must remain disabled")
            applied = self.komodo.apply_profile(configurable, deadline=deadline)
            token.raise_if_cancelled()
            if deadline is not None and self.monotonic() >= deadline:
                raise TimeoutError(f"deadline expired during {name} transition")
            expected = {
                "options": configurable,
                "generation": self.komodo.generation,
            }
            if applied != expected:
                raise ProfileTransitionError(f"could not verify {name} profile")
        except Exception as error:
            self._terminate_uncertain()
            raise ProfileTransitionError(f"failed to apply {name} profile") from error
        self._applied_profile = desired
        self._applied_generation = self.komodo.generation
        if self._applied_profile != desired or self._applied_generation != self.komodo.generation:
            self._terminate_uncertain()
            raise ProfileTransitionError(f"could not verify {name} profile")

    def prepare_reference(self, token, deadline=None):
        self._apply_cold_profile("reference", self._reference_options(), token, deadline)

    def restore_reference(self, token, deadline=None):
        self.prepare_reference(token, deadline)

    def prepare_legacy_selector(self, move_selection_elo, token, deadline=None):
        options = self._reference_options()
        options["Skill"] = self.legacy_skill_for_elo(move_selection_elo)
        self._apply_cold_profile("selector-v1", options, token, deadline)

    def prepare_calibrated_selector(self, profile: EngineProfile, token, deadline=None):
        options = dict(profile.uci_options)
        options.pop("MultiPV", None)
        self._apply_cold_profile("selector-v2", options, token, deadline)

    @property
    def generation(self):
        return self.komodo.generation

    @property
    def ready(self):
        return self.komodo.ready

    def stop(self):
        self.komodo.interrupt()

    def force_restart(self):
        self.komodo.force_terminate()

    def analyse_reference(
        self,
        board,
        *,
        depth,
        multipv,
        time_limit_ms,
        root_moves,
        token,
        deadline=None,
    ):
        token.raise_if_cancelled()
        limit = chess.engine.Limit(depth=depth, time=max(0.001, time_limit_ms / 1000))
        return self.komodo.analyse(
            board,
            limit,
            multipv=multipv,
            clear_hash=False,
            root_moves=root_moves,
            skill_level=None,
            allow_retry=False,
            deadline=deadline,
        )

    def select_move(self, board, *, move_selection_elo, time_limit_ms, token, deadline=None):
        token.raise_if_cancelled()
        self.prepare_legacy_selector(move_selection_elo, token, deadline)
        if deadline is not None:
            remaining_ms = max(0, int((deadline - self.monotonic()) * 1000))
            if remaining_ms <= 0:
                raise TimeoutError("legacy selector budget was consumed by transition")
            time_limit_ms = min(time_limit_ms, remaining_ms)
        limit = chess.engine.Limit(time=max(0.001, time_limit_ms / 1000))
        return self.komodo.play(
            board,
            limit,
            None,
            allow_retry=False,
            deadline=deadline,
        )

    def select_calibrated_move(self, board, *, profile, token, deadline=None):
        token.raise_if_cancelled()
        self.prepare_calibrated_selector(profile, token, deadline)
        if deadline is not None:
            remaining_ms = max(0, int((deadline - self.monotonic()) * 1000))
            if not profile.admits(remaining_ms):
                raise TimeoutError("calibrated selector budget was consumed by transition")
        return self.komodo.play(
            board,
            chess.engine.Limit(time=profile.move_time_ms / 1000),
            None,
            allow_retry=False,
            deadline=deadline,
        )
