import time

import chess
import chess.engine

from core.elo_calibration import EngineProfile
from core.elo_calibration.telemetry import NoopEngineTelemetry


class ProfileTransitionError(RuntimeError):
    pass


class KomodoEngineAdapter:
    def __init__(self, komodo, *, monotonic=time.monotonic, telemetry=None, slot="0"):
        self.komodo = komodo
        self.monotonic = monotonic
        self.telemetry = telemetry or NoopEngineTelemetry()
        self.slot = str(slot)
        self._reference_stage = "reference_shallow"
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
            self.komodo.force_terminate("uncertain_state")
        except TypeError:
            self.komodo.force_terminate()
        except Exception:
            pass
        if getattr(self.komodo, "records_restart_metrics", False) is not True:
            self.telemetry.record_restart("uncertain_state")

    def set_reference_stage(self, stage):
        self._reference_stage = stage

    @staticmethod
    def _analysis_stats(result):
        lines = result if isinstance(result, list) else []
        pairs = []
        for line in lines:
            if not isinstance(line, dict):
                continue
            nodes = line.get("nodes")
            seconds = line.get("time")
            if isinstance(nodes, int) and not isinstance(nodes, bool) and nodes >= 0 and isinstance(seconds, (int, float)) and not isinstance(seconds, bool) and seconds > 0:
                pairs.append((nodes, float(seconds)))
        if not pairs:
            return None, None
        return max(pairs, key=lambda pair: pair[0])

    def _last_play_stats(self):
        stats = getattr(self.komodo, "last_search_stats", None)
        if not isinstance(stats, dict):
            return None, None
        nodes = stats.get("nodes")
        seconds = stats.get("time")
        if not isinstance(nodes, int) or isinstance(nodes, bool) or nodes < 0:
            return None, None
        if not isinstance(seconds, (int, float)) or isinstance(seconds, bool) or seconds <= 0:
            return None, None
        return nodes, float(seconds)

    def _observe_search(self, stage, started, result=None, error=None, play=False):
        status = "timeout" if isinstance(error, TimeoutError) else "error" if error else "ok"
        nodes, engine_seconds = self._last_play_stats() if play else self._analysis_stats(result)
        self.telemetry.record_search(
            slot=self.slot,
            stage=stage,
            status=status,
            duration_seconds=max(0.0, self.monotonic() - started),
            nodes=nodes,
            engine_seconds=engine_seconds,
        )
        if isinstance(error, TimeoutError):
            self.telemetry.record_timeout(stage)
        elif error is not None:
            self.telemetry.record_failure("search")

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
            if isinstance(error, TimeoutError):
                self.telemetry.record_timeout("unknown")
            self.telemetry.record_failure("profile_apply")
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
        try:
            self.komodo.force_terminate("superseded")
        except TypeError:
            self.komodo.force_terminate()
        if getattr(self.komodo, "records_restart_metrics", False) is not True:
            self.telemetry.record_restart("superseded")

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
        started = self.monotonic()
        stage = self._reference_stage
        try:
            result = self.komodo.analyse(
                board,
                limit,
                multipv=multipv,
                clear_hash=False,
                root_moves=root_moves,
                skill_level=None,
                allow_retry=False,
                deadline=deadline,
            )
        except Exception as error:
            self._observe_search(stage, started, error=error)
            raise
        error = getattr(self.komodo, "last_search_error", None) if result is None else None
        self._observe_search(stage, started, result=result, error=error or (RuntimeError("engine search failed") if result is None else None))
        return result

    def select_move(self, board, *, move_selection_elo, time_limit_ms, token, deadline=None):
        token.raise_if_cancelled()
        self.prepare_legacy_selector(move_selection_elo, token, deadline)
        if deadline is not None:
            remaining_ms = max(0, int((deadline - self.monotonic()) * 1000))
            if remaining_ms <= 0:
                raise TimeoutError("legacy selector budget was consumed by transition")
            time_limit_ms = min(time_limit_ms, remaining_ms)
        limit = chess.engine.Limit(time=max(0.001, time_limit_ms / 1000))
        started = self.monotonic()
        try:
            result = self.komodo.play(
                board,
                limit,
                None,
                allow_retry=False,
                deadline=deadline,
            )
        except Exception as error:
            self._observe_search("selector_v1", started, error=error, play=True)
            raise
        error = getattr(self.komodo, "last_search_error", None) if result is None else None
        self._observe_search("selector_v1", started, result=result, error=error or (RuntimeError("engine search failed") if result is None else None), play=True)
        return result

    def select_calibrated_move(self, board, *, profile, token, deadline=None):
        token.raise_if_cancelled()
        self.prepare_calibrated_selector(profile, token, deadline)
        if deadline is not None:
            remaining_ms = max(0, int((deadline - self.monotonic()) * 1000))
            if not profile.admits(remaining_ms):
                raise TimeoutError("calibrated selector budget was consumed by transition")
        started = self.monotonic()
        try:
            result = self.komodo.play(
                board,
                chess.engine.Limit(time=profile.move_time_ms / 1000),
                None,
                allow_retry=False,
                deadline=deadline,
            )
        except Exception as error:
            self._observe_search("selector_v2", started, error=error, play=True)
            raise
        error = getattr(self.komodo, "last_search_error", None) if result is None else None
        self._observe_search("selector_v2", started, result=result, error=error or (RuntimeError("engine search failed") if result is None else None), play=True)
        return result
