import time

import chess
import chess.engine


class KomodoEngineAdapter:
    def __init__(self, komodo, *, monotonic=time.monotonic):
        self.komodo = komodo
        self.monotonic = monotonic

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

    def analyse_reference(self, board, *, depth, multipv, time_limit_ms, root_moves, token):
        token.raise_if_cancelled()
        limit = chess.engine.Limit(depth=depth, time=max(0.001, time_limit_ms / 1000))
        return self.komodo.analyse(
            board,
            limit,
            multipv=multipv,
            clear_hash=False,
            root_moves=root_moves,
            skill_level=20,
            allow_retry=False,
        )

    def select_move(self, board, *, move_selection_elo, time_limit_ms, token):
        token.raise_if_cancelled()
        limit = chess.engine.Limit(time=max(0.001, time_limit_ms / 1000))
        skill_level = max(0, min(25, int((move_selection_elo - 800) / 120)))
        return self.komodo.play(board, limit, skill_level, allow_retry=False)
