import os
import threading
import tempfile
import unittest
import sys
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from unittest.mock import patch

import chess
import chess.engine

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

TEST_CAPABILITY = "test-capability-token-that-is-long-enough"
os.environ["THINKER_CAPABILITY_TOKEN"] = TEST_CAPABILITY
AUTH_HEADERS = {"Authorization": f"Bearer {TEST_CAPABILITY}"}

from core.smart_pacing.cache import BoundedPlanCache
from core.smart_pacing.calibration import CalibrationMode
from core.smart_pacing.contracts import ContractValidationError, MovePlanRequest
from core.smart_pacing.coordinator import CoordinatorObsolete, EngineCoordinator, EngineJob
from core.smart_pacing.identities import (
    analysis_position_key,
    contextual_plan_cache_key,
    observation_key,
    pure_analysis_cache_key,
)
from core.smart_pacing.testing import FakeEngineAdapter
from core.smart_pacing.service import MovePlanService
from core.smart_pacing.analyzer import AnalysisSnapshot, CandidateLine
from core.smart_pacing.evidence import build_evidence
from core.smart_pacing.security import CapabilityStore, SlidingWindowRateLimiter
import app as server_app


def valid_payload(**overrides):
    fen = overrides.pop("fen", chess.STARTING_FEN)
    runtime_game_token = overrides.pop("runtimeGameToken", "game-1")
    position_revision = overrides.pop("positionRevision", 3)
    history_digest = overrides.pop("historyDigest", None)
    history_value = history_digest["value"] if history_digest else None
    payload = {
        "schemaVersion": 1,
        "requestId": "request-1",
        "runtimeGameToken": runtime_game_token,
        "positionRevision": position_revision,
        "observationKey": observation_key(runtime_game_token, position_revision, fen),
        "analysisPositionKey": analysis_position_key(fen, history_value),
        "fen": fen,
        "lastMove": None,
        "historyDigest": history_digest,
        "moveSelectionElo": 2800,
        "perceptionElo": 2700,
        "analysisTier": "standard",
        "clientBudgetMs": 700,
        "analysisBudgetVersion": 1,
        "evidenceModelVersion": 1,
    }
    payload.update(overrides)
    return payload


def engine_line(move, score, depth=10, replies=()):
    return {
        "score": chess.engine.PovScore(chess.engine.Cp(score), chess.WHITE),
        "pv": [chess.Move.from_uci(move), *[chess.Move.from_uci(reply) for reply in replies]],
        "depth": depth,
    }


class MovePlanContractTests(unittest.TestCase):
    def test_valid_request_is_normalized_and_bounded(self):
        request = MovePlanRequest.from_payload(valid_payload(moveSelectionElo=9999, clientBudgetMs=9000))
        self.assertEqual(request.move_selection_elo, 3200)
        self.assertEqual(request.client_budget_ms, 5000)
        self.assertEqual(request.fen, chess.Board().fen(en_passant="fen"))

    def test_mismatched_observation_identity_is_rejected(self):
        with self.assertRaisesRegex(ContractValidationError, "observationKey"):
            MovePlanRequest.from_payload(valid_payload(observationKey="obs1:wrong"))

    def test_mismatched_analysis_identity_is_rejected(self):
        with self.assertRaisesRegex(ContractValidationError, "analysisPositionKey"):
            MovePlanRequest.from_payload(valid_payload(analysisPositionKey="ana1:wrong"))

    def test_invalid_fen_and_free_form_tier_are_rejected(self):
        invalid_fen_payload = valid_payload()
        invalid_fen_payload["fen"] = "invalid"
        with self.assertRaisesRegex(ContractValidationError, "fen"):
            MovePlanRequest.from_payload(invalid_fen_payload)
        with self.assertRaisesRegex(ContractValidationError, "analysisTier"):
            MovePlanRequest.from_payload(valid_payload(analysisTier="uci:Threads=99"))

    def test_underpromotion_uci_is_preserved(self):
        request = MovePlanRequest.from_payload(valid_payload(lastMove="a7a8n"))
        self.assertEqual(request.last_move, "a7a8n")


class IdentityAndCacheTests(unittest.TestCase):
    def test_observation_changes_with_runtime_revision_and_full_fen(self):
        start = chess.STARTING_FEN
        self.assertNotEqual(observation_key("a", 1, start), observation_key("b", 1, start))
        self.assertNotEqual(observation_key("a", 1, start), observation_key("a", 2, start))
        changed_counter = start.rsplit(" ", 2)[0] + " 1 1"
        self.assertNotEqual(observation_key("a", 1, start), observation_key("a", 1, changed_counter))

    def test_analysis_ignores_fullmove_but_not_halfmove_or_history(self):
        start = chess.STARTING_FEN
        fullmove_changed = start.rsplit(" ", 1)[0] + " 8"
        halfmove_changed = start.rsplit(" ", 2)[0] + " 1 1"
        self.assertEqual(analysis_position_key(start), analysis_position_key(fullmove_changed))
        self.assertNotEqual(analysis_position_key(start), analysis_position_key(halfmove_changed))
        self.assertNotEqual(analysis_position_key(start), analysis_position_key(start, "history-a"))

    def test_cache_keys_are_version_and_context_sensitive(self):
        analysis_key = analysis_position_key(chess.STARTING_FEN)
        first = pure_analysis_cache_key(analysis_key, "standard", "g1", 1, 1)
        second = pure_analysis_cache_key(analysis_key, "standard", "g2", 1, 1)
        self.assertNotEqual(first, second)
        plan_a = contextual_plan_cache_key(analysisPositionKey=analysis_key, lastMove=None, perceptionElo=2710)
        plan_b = contextual_plan_cache_key(analysisPositionKey=analysis_key, lastMove="e7e5", perceptionElo=2710)
        self.assertNotEqual(plan_a, plan_b)

    def test_only_complete_plans_enter_bounded_cache(self):
        cache = BoundedPlanCache(capacity=1)
        self.assertFalse(cache.put("partial", {"move": "e2e4"}, status="partial"))
        self.assertTrue(cache.put("first", {"move": "e2e4"}, status="complete"))
        self.assertTrue(cache.put("second", {"move": "d2d4"}, status="complete"))
        self.assertIsNone(cache.get("first"))
        self.assertEqual(cache.get("second"), {"move": "d2d4"})


class EngineCoordinatorTests(unittest.TestCase):
    def test_fake_engine_runs_without_komodo(self):
        adapter = FakeEngineAdapter()
        adapter.queue({"move": "e2e4"})
        coordinator = EngineCoordinator(adapter)
        result = coordinator.run(
            EngineJob("r1", "move-plan", "game", 1),
            500,
            lambda engine, deadline, token: engine.execute("plan", {}, deadline, token),
        )
        self.assertEqual(result.value, {"move": "e2e4"})
        self.assertEqual(result.engine_generation, "fake-1")

    def test_new_revision_obsoletes_active_job_before_lock(self):
        adapter = FakeEngineAdapter()
        adapter.queue({"move": "e2e4"}, blocked=True)
        adapter.queue({"move": "d2d4"})
        coordinator = EngineCoordinator(adapter, cancellation_grace_ms=100)
        first_started = threading.Event()
        outcomes = []

        def operation(engine, deadline, token):
            first_started.set()
            return engine.execute("plan", {}, deadline, token)

        def first_request():
            try:
                coordinator.run(EngineJob("r1", "move-plan", "game", 1), 1000, operation)
            except Exception as error:
                outcomes.append(type(error))

        first = threading.Thread(target=first_request)
        first.start()
        self.assertTrue(first_started.wait(timeout=1))
        second = coordinator.run(
            EngineJob("r2", "move-plan", "game", 2),
            1000,
            lambda engine, deadline, token: engine.execute("plan", {}, deadline, token),
        )
        first.join(timeout=1)
        self.assertFalse(first.is_alive())
        self.assertIn(CoordinatorObsolete, outcomes)
        self.assertEqual(second.value, {"move": "d2d4"})
        self.assertEqual(adapter.stop_calls, 1)

    def test_older_revision_is_rejected_without_engine_call(self):
        adapter = FakeEngineAdapter()
        coordinator = EngineCoordinator(adapter)
        coordinator.run(
            EngineJob("r2", "move-plan", "game", 2),
            500,
            lambda engine, deadline, token: engine.execute("plan", {}, deadline, token),
        )
        with self.assertRaises(CoordinatorObsolete):
            coordinator.run(
                EngineJob("r1", "move-plan", "game", 1),
                500,
                lambda engine, deadline, token: engine.execute("plan", {}, deadline, token),
            )
        self.assertEqual(len(adapter.calls), 1)

    def test_uncooperative_obsolete_job_forces_generation_change(self):
        class StubbornAdapter(FakeEngineAdapter):
            def stop(self):
                self.stop_calls += 1

        adapter = StubbornAdapter()
        coordinator = EngineCoordinator(adapter, cancellation_grace_ms=20)
        entered = threading.Event()
        release = adapter._release
        release.clear()
        errors = []

        def stubborn(_adapter, _deadline, token):
            entered.set()
            release.wait(timeout=1)
            token.raise_if_cancelled()

        def first_request():
            try:
                coordinator.run(EngineJob("old", "move-plan", "game", 1), 1000, stubborn)
            except Exception as error:
                errors.append(type(error))

        thread = threading.Thread(target=first_request)
        thread.start()
        self.assertTrue(entered.wait(timeout=1))
        result = coordinator.run(
            EngineJob("new", "move-plan", "game", 2),
            1000,
            lambda _adapter, _deadline, _token: "new-plan",
        )
        thread.join(timeout=1)
        self.assertEqual(result.value, "new-plan")
        self.assertEqual(adapter.restart_calls, 1)
        self.assertEqual(result.engine_generation, "fake-2")
        self.assertIn(CoordinatorObsolete, errors)

    def test_superseding_queued_game_does_not_interrupt_lease_owner(self):
        class LeaseAdapter(FakeEngineAdapter):
            def stop(self):
                self.stop_calls += 1

        adapter = LeaseAdapter()
        coordinator = EngineCoordinator(adapter, cancellation_grace_ms=20)
        owner_started = threading.Event()
        owner_release = threading.Event()
        queued_started = threading.Event()
        results = []
        errors = []

        def owner_operation(_adapter, _deadline, _token):
            owner_started.set()
            owner_release.wait(timeout=2)
            return "owner"

        def run_queued():
            try:
                coordinator.run(
                    EngineJob("b1", "move-plan", "game-b", 1),
                    1500,
                    lambda _adapter, _deadline, _token: queued_started.set(),
                )
            except Exception as error:
                errors.append(type(error))

        owner = threading.Thread(
            target=lambda: results.append(
                coordinator.run(
                    EngineJob("a1", "move-plan", "game-a", 1),
                    1500,
                    owner_operation,
                ).value
            )
        )
        queued = threading.Thread(target=run_queued)
        owner.start()
        self.assertTrue(owner_started.wait(timeout=1))
        queued.start()
        for _ in range(100):
            active = coordinator._active_by_game.get("game-b")
            if active is not None and active.job.request_id == "b1":
                break
            threading.Event().wait(0.005)

        replacement = threading.Thread(
            target=lambda: results.append(
                coordinator.run(
                    EngineJob("b2", "move-plan", "game-b", 2),
                    1500,
                    lambda _adapter, _deadline, _token: "replacement",
                ).value
            )
        )
        replacement.start()
        threading.Event().wait(0.05)
        self.assertEqual(adapter.stop_calls, 0)
        self.assertEqual(adapter.restart_calls, 0)
        owner_release.set()
        owner.join(timeout=1)
        queued.join(timeout=1)
        replacement.join(timeout=1)

        self.assertFalse(owner.is_alive())
        self.assertFalse(replacement.is_alive())
        self.assertIn("owner", results)
        self.assertIn("replacement", results)
        self.assertFalse(queued_started.is_set())
        self.assertIn(CoordinatorObsolete, errors)

    def test_duplicate_active_request_is_rejected_without_stopping_owner(self):
        adapter = FakeEngineAdapter()
        coordinator = EngineCoordinator(adapter)
        entered = threading.Event()
        release = threading.Event()

        def operation(_adapter, _deadline, _token):
            entered.set()
            release.wait(timeout=1)

        thread = threading.Thread(
            target=lambda: coordinator.run(
                EngineJob("same", "move-plan", "duplicate-game", 1),
                1000,
                operation,
            )
        )
        thread.start()
        self.assertTrue(entered.wait(timeout=1))

        with self.assertRaises(CoordinatorObsolete):
            coordinator.run(
                EngineJob("same", "move-plan", "duplicate-game", 1),
                1000,
                operation,
            )

        self.assertEqual(adapter.stop_calls, 0)
        release.set()
        thread.join(timeout=1)
        self.assertFalse(thread.is_alive())


class EvidenceModelTests(unittest.TestCase):
    def snapshot(self, deep_scores):
        shallow = (
            CandidateLine("e2e4", 20, False, 6, ("e2e4", "e7e5")),
            CandidateLine("d2d4", 18, False, 6, ("d2d4", "d7d5")),
        )
        deep = tuple(
            CandidateLine(move, score, False, 10, (move, "e7e5" if move == "e2e4" else "d7d5"))
            for move, score in deep_scores
        )
        return AnalysisSnapshot(shallow, deep, "d2d4", "e2e4", "complete", None, (), 10, 5, 20)

    def test_more_deep_regret_never_reduces_decision_value(self):
        board = chess.Board()
        low = build_evidence(self.snapshot((("e2e4", 30), ("d2d4", 25))), board, 2600)
        high = build_evidence(self.snapshot((("d2d4", 250), ("e2e4", -150))), board, 2600)
        self.assertGreaterEqual(high["deepRegret"], low["deepRegret"])
        self.assertGreaterEqual(high["decisionValue"], low["decisionValue"])

    def test_candidate_permutation_preserves_entropy(self):
        board = chess.Board()
        first = build_evidence(self.snapshot((("e2e4", 30), ("d2d4", 25))), board, 2200)
        second = build_evidence(self.snapshot((("d2d4", 25), ("e2e4", 30))), board, 2200)
        self.assertAlmostEqual(first["choiceEntropy"], second["choiceEntropy"])

    def test_all_scores_and_confidences_are_bounded(self):
        evidence = build_evidence(self.snapshot((("e2e4", 100000), ("d2d4", -100000))), chess.Board(), 3200)
        for field in (
            "decisionValue",
            "forcedness",
            "analysisConfidence",
            "moveProvenanceConfidence",
            "choiceEntropy",
            "deepRegret",
            "selectedMoveRegret",
            "moveInstability",
            "evaluationInstability",
            "tacticalUncertainty",
            "pvForcingRatio",
            "positionBalance",
            "familiarity",
        ):
            self.assertGreaterEqual(evidence[field], 0)
            self.assertLessEqual(evidence[field], 1)


class MovePlanServiceTests(unittest.TestCase):
    def test_forced_move_never_calls_engine(self):
        adapter = FakeEngineAdapter()
        service = MovePlanService(EngineCoordinator(adapter))
        request = MovePlanRequest.from_payload(valid_payload(
            fen="7k/5K2/8/6Q1/8/8/8/8 b - - 0 1",
            runtimeGameToken="forced",
            positionRevision=1,
        ))
        plan = service.create_plan(request)
        self.assertEqual(plan["status"], "complete")
        self.assertEqual(plan["source"], "forced")
        self.assertEqual(plan["evidence"]["forcedness"], 1.0)
        self.assertEqual(adapter.calls, [])

    def test_book_plan_has_high_provenance_but_low_analysis_confidence(self):
        adapter = FakeEngineAdapter()
        service = MovePlanService(EngineCoordinator(adapter), book_lookup=lambda _fen: "e2e4")
        request = MovePlanRequest.from_payload(valid_payload())
        plan = service.create_plan(request)
        self.assertEqual(plan["source"], "book")
        self.assertEqual(plan["move"], "e2e4")
        self.assertEqual(plan["evidence"]["moveProvenanceConfidence"], 1.0)
        self.assertLess(plan["evidence"]["analysisConfidence"], 0.5)

    def test_two_lens_plan_binds_selected_move_and_reference_evidence(self):
        adapter = FakeEngineAdapter()
        adapter.queue([
            engine_line("e2e4", 30, 6, ("e7e5",)),
            engine_line("d2d4", 25, 6, ("d7d5",)),
        ])
        adapter.queue(chess.Move.from_uci("d2d4"))
        adapter.queue([
            engine_line("e2e4", 80, 10, ("c7c5",)),
            engine_line("d2d4", 10, 10, ("d7d5",)),
        ])
        service = MovePlanService(EngineCoordinator(adapter))
        plan = service.create_plan(MovePlanRequest.from_payload(valid_payload()))
        self.assertEqual(plan["status"], "complete")
        self.assertEqual(plan["move"], "d2d4")
        self.assertEqual(plan["referenceBestMove"], "e2e4")
        self.assertGreater(plan["evidence"]["selectedMoveRegret"], 0)
        self.assertEqual(
            [call[0] for call in adapter.calls],
            [
                "apply_profile", "clear_hash", "ready", "reference",
                "apply_profile", "clear_hash", "ready", "selector",
                "apply_profile", "clear_hash", "ready", "reference",
            ],
        )

    def test_partial_plan_is_not_cached(self):
        adapter = FakeEngineAdapter()
        adapter.queue([engine_line("e2e4", 30, 6)])
        adapter.queue(chess.Move.from_uci("e2e4"))
        adapter.queue(error=TimeoutError("deep expired"))
        service = MovePlanService(EngineCoordinator(adapter))
        request = MovePlanRequest.from_payload(valid_payload())
        first = service.create_plan(request)
        self.assertEqual(first["status"], "partial")
        adapter.queue([engine_line("d2d4", 35, 6)])
        adapter.queue(chess.Move.from_uci("d2d4"))
        adapter.queue([engine_line("d2d4", 50, 10)])
        second = service.create_plan(request)
        self.assertEqual(second["source"], "engine")
        self.assertEqual(second["move"], "d2d4")

    def test_complete_plan_cache_preserves_evidence(self):
        adapter = FakeEngineAdapter()
        adapter.queue([engine_line("e2e4", 30, 6)])
        adapter.queue(chess.Move.from_uci("e2e4"))
        adapter.queue([engine_line("e2e4", 50, 10)])
        service = MovePlanService(EngineCoordinator(adapter))
        request = MovePlanRequest.from_payload(valid_payload())
        first = service.create_plan(request)
        second = service.create_plan(request)
        self.assertEqual(second["source"], "cache")
        self.assertEqual(second["evidence"], first["evidence"])
        self.assertEqual(len(adapter.calls), 12)

    def test_cache_hit_rebinds_runtime_observation_identity(self):
        adapter = FakeEngineAdapter()
        adapter.queue([engine_line("e2e4", 30, 6)])
        adapter.queue(chess.Move.from_uci("e2e4"))
        adapter.queue([engine_line("e2e4", 50, 10)])
        service = MovePlanService(EngineCoordinator(adapter))
        first = service.create_plan(MovePlanRequest.from_payload(valid_payload()))
        second_request = MovePlanRequest.from_payload(
            valid_payload(
                runtimeGameToken="game-2",
                positionRevision=9,
                requestId="request-2",
            )
        )
        second = service.create_plan(second_request)
        self.assertEqual(second["source"], "cache")
        self.assertEqual(second["requestId"], "request-2")
        self.assertEqual(second["observationKey"], second_request.observation_key)
        self.assertEqual(second["positionRevision"], 9)
        self.assertNotEqual(second["observationKey"], first["observationKey"])


class MovePlanEndpointTests(unittest.TestCase):
    def test_invalid_contract_returns_structured_400(self):
        response = server_app.app.test_client().post(
            "/move-plan", json={"schemaVersion": 1}, headers=AUTH_HEADERS
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"], "invalid_move_plan_request")

    def test_endpoint_uses_hermetic_move_plan_service(self):
        adapter = FakeEngineAdapter()
        adapter.queue([engine_line("e2e4", 30, 6)])
        adapter.queue(chess.Move.from_uci("e2e4"))
        adapter.queue([engine_line("e2e4", 50, 10)])
        service = MovePlanService(EngineCoordinator(adapter))
        original = server_app.move_plan_service
        server_app.move_plan_service = service
        try:
            response = server_app.app.test_client().post(
                "/move-plan", json=valid_payload(), headers=AUTH_HEADERS
            )
        finally:
            server_app.move_plan_service = original
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["move"], "e2e4")
        self.assertEqual(response.get_json()["status"], "complete")

    def test_health_exposes_readiness_and_generation(self):
        response = server_app.app.test_client().get("/health")
        data = response.get_json()
        self.assertIn("ready", data)
        self.assertIn("engineGeneration", data)

    def test_release_endpoint_clears_coordinator_and_calibration_state(self):
        with patch.object(server_app.engine_coordinator, "release_game") as release_job, patch.object(
            server_app.calibration_runtime,
            "release_game",
        ) as release_profile:
            response = server_app.app.test_client().post(
                "/move-plan/release",
                json={"runtimeGameToken": "finished-game"},
                headers=AUTH_HEADERS,
            )

        self.assertEqual(response.status_code, 204)
        release_job.assert_called_once_with("finished-game")
        release_profile.assert_called_once_with("finished-game")


class CapabilitySecurityTests(unittest.TestCase):
    def test_metrics_requires_loopback_bearer_and_exposes_prometheus(self):
        client = server_app.app.test_client()
        missing = client.get("/metrics")
        remote = client.get(
            "/metrics",
            headers=AUTH_HEADERS,
            environ_base={"REMOTE_ADDR": "10.0.0.8"},
        )
        authorized = client.get("/metrics", headers=AUTH_HEADERS)

        self.assertEqual(missing.status_code, 401)
        self.assertEqual(remote.status_code, 403)
        self.assertEqual(remote.get_json(), {"error": "loopback_required"})
        self.assertEqual(authorized.status_code, 200)
        self.assertTrue(authorized.content_type.startswith("text/plain"))
        self.assertIn(b"thinker_engine_search_nodes_total", authorized.data)
        self.assertNotIn(TEST_CAPABILITY.encode("utf-8"), authorized.data)

    def test_invalid_rollout_configuration_fails_to_shadow(self):
        with patch.dict(
            os.environ,
            {
                "THINKER_ELO_CALIBRATION_MODE": "canary",
                "THINKER_ELO_CALIBRATION_CANARY_PERCENT": "100.001",
            },
            clear=False,
        ):
            policy = server_app.build_rollout_policy()

        self.assertEqual(policy.mode, CalibrationMode.SHADOW)
        self.assertEqual(policy.canary_basis_points, 0)

    def test_protected_endpoint_requires_bearer_capability(self):
        client = server_app.app.test_client()
        protected_requests = (
            ("/move-plan", valid_payload()),
            ("/move-plan/release", {"runtimeGameToken": "game-1"}),
            ("/getmove", {"fen": chess.STARTING_FEN, "elo": 1200, "time": 0.01}),
            ("/analyze", {"fen": chess.STARTING_FEN}),
            ("/eval", {"fen": chess.STARTING_FEN}),
        )
        for route, payload in protected_requests:
            with self.subTest(route=route):
                missing = client.post(route, json=payload)
                self.assertEqual(missing.status_code, 401)
                self.assertEqual(missing.get_json(), {"error": "capability_required"})
        invalid = client.post(
            "/move-plan",
            json=valid_payload(),
            headers={"Authorization": "Bearer wrong-token"},
        )
        self.assertEqual(invalid.status_code, 401)
        self.assertEqual(invalid.get_json(), {"error": "invalid_capability"})

    def test_protected_endpoint_rejects_non_chess_origin(self):
        response = server_app.app.test_client().post(
            "/move-plan",
            json=valid_payload(),
            headers={**AUTH_HEADERS, "Origin": "https://example.com"},
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json(), {"error": "origin_not_allowed"})

    def test_capability_store_persists_and_rotates_token(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent) as directory:
            path = Path(directory) / "capability.json"
            store = CapabilityStore(path=path, environ={})
            first = store.ensure()
            self.assertGreaterEqual(len(first), 32)
            self.assertEqual(CapabilityStore(path=path, environ={}).ensure(), first)
            second = store.rotate()
            self.assertNotEqual(second, first)
            self.assertNotIn(first, path.read_text(encoding="utf-8"))

    def test_environment_capability_rejects_weak_token(self):
        store = CapabilityStore(path="unused.json", environ={"THINKER_CAPABILITY_TOKEN": "weak"})
        with self.assertRaisesRegex(ValueError, "at least 32"):
            store.ensure()

    def test_sliding_window_rate_limiter_recovers_after_window(self):
        now = [10.0]
        limiter = SlidingWindowRateLimiter(
            limit=2, window_seconds=5, monotonic=lambda: now[0]
        )
        self.assertTrue(limiter.allow("client"))
        self.assertTrue(limiter.allow("client"))
        self.assertFalse(limiter.allow("client"))
        now[0] = 15.1
        self.assertTrue(limiter.allow("client"))

    def test_pairing_instruction_prints_exact_token(self):
        output = StringIO()
        with redirect_stdout(output):
            token = server_app.print_pairing_instructions()
        self.assertEqual(token, TEST_CAPABILITY)
        self.assertIn("COLE ESTE TOKEN NO SEU SCRIPT:", output.getvalue())
        self.assertIn(TEST_CAPABILITY, output.getvalue())


if __name__ == "__main__":
    unittest.main()
