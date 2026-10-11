import time
from dataclasses import dataclass

import chess


@dataclass(frozen=True)
class CandidateLine:
    move: str
    score_cp: int
    is_mate: bool
    depth: int
    pv: tuple[str, ...]


@dataclass(frozen=True)
class AnalysisSnapshot:
    shallow: tuple[CandidateLine, ...]
    deep: tuple[CandidateLine, ...]
    selected_move: str
    reference_best_move: str
    status: str
    fallback_reason: str | None
    reason_codes: tuple[str, ...]
    shallow_elapsed_ms: int
    selection_elapsed_ms: int
    deep_elapsed_ms: int


class EngineAnalyzer:
    _TIERS = {
        "survival": (3, 4, 2),
        "fast": (4, 6, 3),
        "standard": (6, 10, 5),
        "deep": (7, 14, 5),
    }

    def __init__(self, *, monotonic=time.monotonic):
        self.monotonic = monotonic

    def _remaining_ms(self, deadline):
        return max(0, int((deadline - self.monotonic()) * 1000))

    def _candidate_lines(self, raw_lines, turn, board):
        candidates = []
        for info in raw_lines or []:
            pv = info.get("pv") or []
            if not pv or pv[0] not in board.legal_moves:
                continue
            score = info.get("score")
            relative = score.pov(turn) if score is not None else None
            score_cp = relative.score(mate_score=100_000) if relative is not None else 0
            candidates.append(
                CandidateLine(
                    move=pv[0].uci(),
                    score_cp=int(score_cp or 0),
                    is_mate=bool(relative and relative.is_mate()),
                    depth=int(info.get("depth") or 0),
                    pv=tuple(move.uci() for move in pv[:8]),
                )
            )
        return tuple(candidates)

    def analyze(self, adapter, board, request, deadline, token):
        shallow_depth, deep_depth, multipv = self._TIERS[request.analysis_tier]
        legal_moves = list(board.legal_moves)
        shallow_started = self.monotonic()
        remaining = self._remaining_ms(deadline)
        if remaining <= 0:
            raise TimeoutError("deadline expired before shallow analysis")
        shallow_raw = adapter.analyse_reference(
            board,
            depth=shallow_depth,
            multipv=min(multipv, len(legal_moves)),
            time_limit_ms=max(1, int(remaining * 0.38)),
            root_moves=None,
            token=token,
        )
        shallow_elapsed_ms = max(0, round((self.monotonic() - shallow_started) * 1000))
        token.raise_if_cancelled()
        shallow = self._candidate_lines(shallow_raw, board.turn, board)
        if not shallow:
            fallback = legal_moves[0].uci()
            return AnalysisSnapshot(
                shallow=(),
                deep=(),
                selected_move=fallback,
                reference_best_move=fallback,
                status="fallback",
                fallback_reason="REFERENCE_SHALLOW_UNAVAILABLE",
                reason_codes=("ANALYSIS_PARTIAL",),
                shallow_elapsed_ms=shallow_elapsed_ms,
                selection_elapsed_ms=0,
                deep_elapsed_ms=0,
            )
        reference_best = shallow[0].move
        selected_move = reference_best
        fallback_reason = None
        reason_codes = []
        selection_started = self.monotonic()
        remaining = self._remaining_ms(deadline)
        if remaining <= 0:
            fallback_reason = "SELECTOR_FALLBACK_NOT_STARTED"
        else:
            try:
                selected = adapter.select_move(
                    board,
                    move_selection_elo=request.move_selection_elo,
                    time_limit_ms=max(1, int(remaining * 0.35)),
                    token=token,
                )
                if selected is None:
                    fallback_reason = "SELECTOR_FALLBACK_FAILED"
                elif selected not in board.legal_moves:
                    fallback_reason = "SELECTOR_FALLBACK_INVALID"
                else:
                    selected_move = selected.uci()
            except TimeoutError:
                fallback_reason = "SELECTOR_FALLBACK_EXPIRED"
            except Exception:
                fallback_reason = "SELECTOR_FALLBACK_FAILED"
        selection_elapsed_ms = max(0, round((self.monotonic() - selection_started) * 1000))
        if fallback_reason:
            reason_codes.append(fallback_reason)
        deep_started = self.monotonic()
        deep = ()
        status = "complete"
        remaining = self._remaining_ms(deadline)
        if request.analysis_tier == "survival" or remaining <= 1:
            status = "partial"
            reason_codes.append("ANALYSIS_PARTIAL")
        else:
            root_uci = list(dict.fromkeys([line.move for line in shallow] + [selected_move]))
            root_moves = [chess.Move.from_uci(move) for move in root_uci]
            try:
                deep_raw = adapter.analyse_reference(
                    board,
                    depth=deep_depth,
                    multipv=min(len(root_moves), multipv),
                    time_limit_ms=max(1, remaining - 1),
                    root_moves=root_moves,
                    token=token,
                )
                deep = self._candidate_lines(deep_raw, board.turn, board)
                if not deep:
                    status = "partial"
                    reason_codes.append("ANALYSIS_PARTIAL")
            except Exception:
                status = "partial"
                reason_codes.append("ANALYSIS_PARTIAL")
        deep_elapsed_ms = max(0, round((self.monotonic() - deep_started) * 1000))
        return AnalysisSnapshot(
            shallow=shallow,
            deep=deep,
            selected_move=selected_move,
            reference_best_move=reference_best,
            status=status,
            fallback_reason=fallback_reason,
            reason_codes=tuple(dict.fromkeys(reason_codes)),
            shallow_elapsed_ms=shallow_elapsed_ms,
            selection_elapsed_ms=selection_elapsed_ms,
            deep_elapsed_ms=deep_elapsed_ms,
        )
