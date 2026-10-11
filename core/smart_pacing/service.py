import time

import chess

from .analyzer import EngineAnalyzer
from .cache import BoundedPlanCache
from .contracts import MovePlanResponse
from .coordinator import CoordinatorDeadlineExceeded, CoordinatorObsolete, EngineJob
from .evidence import build_evidence, static_evidence
from .identities import contextual_plan_cache_key, quantize_elo


class MovePlanService:
    def __init__(self, coordinator, *, book_lookup=None, cache=None, analyzer=None, monotonic=time.monotonic):
        self.coordinator = coordinator
        self.book_lookup = book_lookup or (lambda _fen: None)
        self.cache = cache or BoundedPlanCache()
        self.analyzer = analyzer or EngineAnalyzer(monotonic=monotonic)
        self.monotonic = monotonic

    def _plan_cache_key(self, request):
        return contextual_plan_cache_key(
            planKeyVersion=1,
            analysisPositionKey=request.analysis_position_key,
            normalizedLastMoveOrNone=request.last_move,
            historyDigestOrUnknown=request.history_digest.value if request.history_digest else "unknown",
            analysisTier=request.analysis_tier,
            analysisBudgetClass=min(10, request.client_budget_ms // 250),
            engineGeneration=self.coordinator.generation,
            bookVersion=1,
            referenceAnalyzerVersion=1,
            evidenceModelVersion=request.evidence_model_version,
            moveSelectionElo=quantize_elo(request.move_selection_elo),
            moveSelectorVersion=1,
            selectorSeedPolicyVersion=1,
            perceptionElo=quantize_elo(request.perception_elo),
            perceptionModelVersion=1,
        )

    def create_plan(self, request):
        started = self.monotonic()
        board = chess.Board(request.fen)
        legal_moves = list(board.legal_moves)
        if not legal_moves:
            return self._response(request, None, None, "static", "terminal", static_evidence(board), started)
        if len(legal_moves) == 1:
            move = legal_moves[0].uci()
            evidence = static_evidence(board, forced=True, reason_codes=("ONLY_LEGAL_MOVE",))
            return self._response(request, move, move, "forced", "complete", evidence, started)
        cache_key = self._plan_cache_key(request)
        cached = self.cache.get(cache_key)
        if cached is not None:
            payload = dict(cached)
            payload["requestId"] = request.request_id
            payload["observationKey"] = request.observation_key
            payload["analysisPositionKey"] = request.analysis_position_key
            payload["positionRevision"] = request.position_revision
            payload["source"] = "cache"
            payload["diagnostics"] = dict(
                payload["diagnostics"],
                cacheHit=True,
                totalServiceMs=max(0, round((self.monotonic() - started) * 1000)),
            )
            return payload
        book_move = self.book_lookup(request.fen)
        try:
            parsed_book_move = chess.Move.from_uci(book_move) if book_move else None
        except ValueError:
            parsed_book_move = None
        if parsed_book_move in board.legal_moves:
            evidence = static_evidence(board, familiarity=1.0, reason_codes=("BOOK_FAMILIAR",))
            response = self._response(request, book_move, book_move, "book", "complete", evidence, started)
            self.cache.put(cache_key, response, status="complete")
            return response
        job = EngineJob(
            request_id=request.request_id,
            kind="move-plan",
            runtime_game_token=request.runtime_game_token,
            position_revision=request.position_revision,
        )
        try:
            coordinated = self.coordinator.run(
                job,
                request.client_budget_ms,
                lambda adapter, deadline, token: self.analyzer.analyze(adapter, board, request, deadline, token),
            )
        except CoordinatorObsolete:
            return self._typed_fallback(request, board, legal_moves[0].uci(), "REQUEST_OBSOLETE", started)
        except CoordinatorDeadlineExceeded:
            return self._typed_fallback(request, board, legal_moves[0].uci(), "ANALYSIS_DEADLINE_EXCEEDED", started)
        snapshot = coordinated.value
        evidence = build_evidence(snapshot, board, request.perception_elo)
        diagnostics = {
            "analysisTier": request.analysis_tier,
            "referenceAnalyzerVersion": 1,
            "moveSelectorVersion": 1,
            "moveSelectionElo": quantize_elo(request.move_selection_elo),
            "perceptionElo": quantize_elo(request.perception_elo),
            "shallowElapsedMs": snapshot.shallow_elapsed_ms,
            "selectionElapsedMs": snapshot.selection_elapsed_ms,
            "deepElapsedMs": snapshot.deep_elapsed_ms,
            "queueElapsedMs": coordinated.queue_elapsed_ms,
            "engineElapsedMs": snapshot.shallow_elapsed_ms + snapshot.selection_elapsed_ms + snapshot.deep_elapsed_ms,
            "totalServiceMs": coordinated.total_elapsed_ms,
            "fallbackReason": snapshot.fallback_reason,
            "engineGeneration": coordinated.engine_generation,
            "cacheHit": False,
        }
        response = self._response(
            request,
            snapshot.selected_move,
            snapshot.reference_best_move,
            "engine" if snapshot.status != "fallback" else "static",
            snapshot.status,
            evidence,
            started,
            diagnostics,
        )
        self.cache.put(cache_key, response, status=snapshot.status)
        return response

    def _typed_fallback(self, request, board, move, reason, started):
        evidence = static_evidence(board, reason_codes=("ANALYSIS_PARTIAL", reason))
        return self._response(
            request,
            move,
            move,
            "static",
            "fallback",
            evidence,
            started,
            {"fallbackReason": reason, "engineGeneration": self.coordinator.generation, "cacheHit": False},
        )

    def _response(self, request, move, reference_move, source, status, evidence, started, diagnostics=None):
        merged_diagnostics = {
            "analysisTier": request.analysis_tier,
            "totalServiceMs": max(0, round((self.monotonic() - started) * 1000)),
            "fallbackReason": None,
            "engineGeneration": self.coordinator.generation,
            "cacheHit": False,
        }
        if diagnostics:
            merged_diagnostics.update(diagnostics)
        return MovePlanResponse(
            request_id=request.request_id,
            observation_key=request.observation_key,
            analysis_position_key=request.analysis_position_key,
            position_revision=request.position_revision,
            move=move,
            reference_best_move=reference_move,
            source=source,
            status=status,
            evidence=evidence,
            diagnostics=merged_diagnostics,
            evidence_model_version=request.evidence_model_version,
        ).to_payload()
