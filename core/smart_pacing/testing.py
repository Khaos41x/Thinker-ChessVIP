import collections
import threading


class FakeEngineAdapter:
    def __init__(self):
        self._generation_number = 1
        self._ready = True
        self._script = collections.deque()
        self.calls = []
        self.stop_calls = 0
        self.restart_calls = 0
        self._release = threading.Event()
        self._release.set()

    @property
    def generation(self):
        return f"fake-{self._generation_number}"

    @property
    def ready(self):
        return self._ready

    def queue(self, value=None, *, error=None, blocked=False):
        self._script.append((value, error, blocked))

    def execute(self, name, payload, deadline, token):
        self.calls.append((name, payload, deadline))
        value, error, blocked = self._script.popleft() if self._script else (payload, None, False)
        if blocked:
            self._release.clear()
            while not self._release.wait(timeout=0.005):
                token.raise_if_cancelled()
        token.raise_if_cancelled()
        if error is not None:
            raise error
        return value

    def analyse_reference(self, board, *, depth, multipv, time_limit_ms, root_moves, token):
        return self.execute(
            "reference",
            {
                "board": board,
                "depth": depth,
                "multipv": multipv,
                "timeLimitMs": time_limit_ms,
                "rootMoves": root_moves,
            },
            float("inf"),
            token,
        )

    def select_move(self, board, *, move_selection_elo, time_limit_ms, token):
        return self.execute(
            "selector",
            {
                "board": board,
                "moveSelectionElo": move_selection_elo,
                "timeLimitMs": time_limit_ms,
            },
            float("inf"),
            token,
        )

    def stop(self):
        self.stop_calls += 1
        self._release.set()

    def force_restart(self):
        self.restart_calls += 1
        self._generation_number += 1
        self._ready = True
        self._release.set()
