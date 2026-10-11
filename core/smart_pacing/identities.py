import hashlib
import json

import chess


OBSERVATION_KEY_VERSION = 1
ANALYSIS_KEY_VERSION = 1
PURE_CACHE_KEY_VERSION = 1
SELECTION_CACHE_KEY_VERSION = 1
PLAN_KEY_VERSION = 1


def _digest(namespace, payload):
    encoded = json.dumps(
        {"namespace": namespace, "payload": payload},
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def normalize_full_fen(fen):
    if not isinstance(fen, str):
        raise ValueError("fen must be a string")
    fields = fen.strip().split()
    if len(fields) != 6:
        raise ValueError("fen must contain six fields")
    board = chess.Board(" ".join(fields))
    if not board.is_valid():
        raise ValueError("fen describes an invalid position")
    return board.fen(en_passant="fen")


def observation_key(runtime_game_token, position_revision, fen, schema_version=1):
    normalized = normalize_full_fen(fen)
    value = _digest(
        f"observation-v{OBSERVATION_KEY_VERSION}",
        {
            "schemaVersion": int(schema_version),
            "runtimeGameToken": str(runtime_game_token),
            "positionRevision": int(position_revision),
            "exactFullFen": normalized,
        },
    )
    return f"obs{OBSERVATION_KEY_VERSION}:{value}"


def analysis_position_key(fen, history_digest=None):
    normalized = normalize_full_fen(fen)
    board = chess.Board(normalized)
    history_value = history_digest if history_digest else "unknown"
    value = _digest(
        f"analysis-v{ANALYSIS_KEY_VERSION}",
        {
            "boardFen": board.board_fen(),
            "sideToMove": "w" if board.turn else "b",
            "castlingRights": board.castling_xfen(),
            "enPassantSquare": chess.square_name(board.ep_square) if board.ep_square is not None else "-",
            "halfmoveClock": board.halfmove_clock,
            "historyDigestOrUnknown": history_value,
        },
    )
    return f"ana{ANALYSIS_KEY_VERSION}:{value}"


def quantize_elo(elo, step=100):
    bounded = max(600, min(3200, int(elo)))
    return int(round(bounded / step) * step)


def pure_analysis_cache_key(
    analysis_key,
    analysis_tier,
    engine_generation,
    reference_analyzer_version,
    evidence_model_version,
):
    value = _digest(
        f"pure-cache-v{PURE_CACHE_KEY_VERSION}",
        {
            "analysisPositionKey": analysis_key,
            "analysisTier": analysis_tier,
            "engineGeneration": engine_generation,
            "referenceAnalyzerVersion": reference_analyzer_version,
            "evidenceModelVersion": evidence_model_version,
        },
    )
    return f"pure{PURE_CACHE_KEY_VERSION}:{value}"


def selection_cache_key(
    analysis_key,
    move_selection_elo,
    move_selector_version,
    engine_generation,
    selector_seed_policy_version,
):
    value = _digest(
        f"selection-cache-v{SELECTION_CACHE_KEY_VERSION}",
        {
            "analysisPositionKey": analysis_key,
            "quantizedMoveSelectionElo": quantize_elo(move_selection_elo),
            "moveSelectorVersion": move_selector_version,
            "engineGeneration": engine_generation,
            "selectorSeedPolicyVersion": selector_seed_policy_version,
        },
    )
    return f"selection{SELECTION_CACHE_KEY_VERSION}:{value}"


def contextual_plan_cache_key(**components):
    normalized = dict(components)
    if "moveSelectionElo" in normalized:
        normalized["quantizedMoveSelectionElo"] = quantize_elo(normalized.pop("moveSelectionElo"))
    if "perceptionElo" in normalized:
        normalized["quantizedPerceptionElo"] = quantize_elo(normalized.pop("perceptionElo"))
    value = _digest(f"plan-cache-v{PLAN_KEY_VERSION}", normalized)
    return f"plan{PLAN_KEY_VERSION}:{value}"
