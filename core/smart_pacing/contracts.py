import math
import re
from dataclasses import dataclass

from .identities import analysis_position_key, normalize_full_fen, observation_key


SCHEMA_VERSION = 1
ANALYSIS_BUDGET_VERSION = 1
EVIDENCE_MODEL_VERSION = 1
ANALYSIS_TIERS = frozenset({"survival", "fast", "standard", "deep"})
PLAN_STATUSES = frozenset({"complete", "partial", "fallback", "terminal", "error"})
PLAN_SOURCES = frozenset({"forced", "book", "cache", "engine", "static"})
UCI_PATTERN = re.compile(r"^[a-h][1-8][a-h][1-8][qrbn]?$")


class ContractValidationError(ValueError):
    def __init__(self, field, message):
        self.field = field
        self.message = message
        super().__init__(f"{field}: {message}")

    def to_payload(self):
        return {"error": "invalid_move_plan_request", "field": self.field, "message": self.message}


def _object(payload):
    if not isinstance(payload, dict):
        raise ContractValidationError("body", "must be a JSON object")
    return payload


def _string(payload, field, *, minimum=1, maximum=256, optional=False):
    value = payload.get(field)
    if optional and value is None:
        return None
    if not isinstance(value, str):
        raise ContractValidationError(field, "must be a string")
    value = value.strip()
    if len(value) < minimum or len(value) > maximum:
        raise ContractValidationError(field, f"length must be between {minimum} and {maximum}")
    return value


def _integer(payload, field, *, minimum, maximum):
    value = payload.get(field)
    if isinstance(value, bool) or not isinstance(value, int):
        raise ContractValidationError(field, "must be an integer")
    if value < minimum or value > maximum:
        raise ContractValidationError(field, f"must be between {minimum} and {maximum}")
    return value


def _number(value, field, *, minimum, maximum):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ContractValidationError(field, "must be a finite number")
    if value < minimum or value > maximum:
        raise ContractValidationError(field, f"must be between {minimum} and {maximum}")
    return float(value)


@dataclass(frozen=True)
class HistoryDigest:
    value: str
    confidence: float

    @classmethod
    def from_payload(cls, payload):
        if payload is None:
            return None
        if not isinstance(payload, dict):
            raise ContractValidationError("historyDigest", "must be an object")
        value = _string(payload, "value", maximum=128)
        confidence = _number(payload.get("confidence"), "historyDigest.confidence", minimum=0, maximum=1)
        return cls(value=value, confidence=confidence)


@dataclass(frozen=True)
class MovePlanRequest:
    schema_version: int
    request_id: str
    runtime_game_token: str
    position_revision: int
    observation_key: str
    analysis_position_key: str
    fen: str
    last_move: str | None
    history_digest: HistoryDigest | None
    move_selection_elo: int
    perception_elo: int
    analysis_tier: str
    client_budget_ms: int
    analysis_budget_version: int
    evidence_model_version: int

    @classmethod
    def from_payload(cls, raw_payload):
        payload = _object(raw_payload)
        schema_version = _integer(payload, "schemaVersion", minimum=SCHEMA_VERSION, maximum=SCHEMA_VERSION)
        request_id = _string(payload, "requestId", maximum=128)
        runtime_game_token = _string(payload, "runtimeGameToken", maximum=128)
        position_revision = _integer(payload, "positionRevision", minimum=0, maximum=2_147_483_647)
        fen_value = _string(payload, "fen", maximum=200)
        try:
            normalized_fen = normalize_full_fen(fen_value)
        except ValueError as error:
            raise ContractValidationError("fen", str(error)) from error
        history_digest = HistoryDigest.from_payload(payload.get("historyDigest"))
        history_value = history_digest.value if history_digest else None
        supplied_observation_key = _string(payload, "observationKey", maximum=128)
        expected_observation_key = observation_key(runtime_game_token, position_revision, normalized_fen, schema_version)
        if supplied_observation_key != expected_observation_key:
            raise ContractValidationError("observationKey", "does not match runtime identity")
        supplied_analysis_key = _string(payload, "analysisPositionKey", maximum=128)
        expected_analysis_key = analysis_position_key(normalized_fen, history_value)
        if supplied_analysis_key != expected_analysis_key:
            raise ContractValidationError("analysisPositionKey", "does not match canonical position identity")
        last_move = _string(payload, "lastMove", maximum=5, optional=True)
        if last_move is not None and not UCI_PATTERN.fullmatch(last_move):
            raise ContractValidationError("lastMove", "must be normalized UCI")
        move_selection_elo = _integer(payload, "moveSelectionElo", minimum=100, maximum=10_000)
        perception_elo = _integer(payload, "perceptionElo", minimum=100, maximum=10_000)
        analysis_tier = _string(payload, "analysisTier", maximum=16)
        if analysis_tier not in ANALYSIS_TIERS:
            raise ContractValidationError("analysisTier", "is not supported")
        raw_budget = _integer(payload, "clientBudgetMs", minimum=1, maximum=60_000)
        analysis_budget_version = _integer(
            payload,
            "analysisBudgetVersion",
            minimum=ANALYSIS_BUDGET_VERSION,
            maximum=ANALYSIS_BUDGET_VERSION,
        )
        evidence_model_version = _integer(
            payload,
            "evidenceModelVersion",
            minimum=EVIDENCE_MODEL_VERSION,
            maximum=EVIDENCE_MODEL_VERSION,
        )
        return cls(
            schema_version=schema_version,
            request_id=request_id,
            runtime_game_token=runtime_game_token,
            position_revision=position_revision,
            observation_key=supplied_observation_key,
            analysis_position_key=supplied_analysis_key,
            fen=normalized_fen,
            last_move=last_move,
            history_digest=history_digest,
            move_selection_elo=max(600, min(3200, move_selection_elo)),
            perception_elo=max(600, min(3200, perception_elo)),
            analysis_tier=analysis_tier,
            client_budget_ms=max(25, min(5_000, raw_budget)),
            analysis_budget_version=analysis_budget_version,
            evidence_model_version=evidence_model_version,
        )


@dataclass(frozen=True)
class MovePlanResponse:
    request_id: str
    observation_key: str
    analysis_position_key: str
    position_revision: int
    move: str | None
    reference_best_move: str | None
    source: str
    status: str
    evidence: dict
    diagnostics: dict
    calibration: dict
    schema_version: int = SCHEMA_VERSION
    evidence_model_version: int = EVIDENCE_MODEL_VERSION

    def to_payload(self):
        if self.status not in PLAN_STATUSES:
            raise ContractValidationError("status", "is not supported")
        if self.source not in PLAN_SOURCES:
            raise ContractValidationError("source", "is not supported")
        for field, move in (("move", self.move), ("referenceBestMove", self.reference_best_move)):
            if move is not None and not UCI_PATTERN.fullmatch(move):
                raise ContractValidationError(field, "must be normalized UCI")
        return {
            "schemaVersion": self.schema_version,
            "requestId": self.request_id,
            "observationKey": self.observation_key,
            "analysisPositionKey": self.analysis_position_key,
            "positionRevision": self.position_revision,
            "move": self.move,
            "referenceBestMove": self.reference_best_move,
            "source": self.source,
            "status": self.status,
            "evidenceModelVersion": self.evidence_model_version,
            "evidence": dict(self.evidence),
            "diagnostics": dict(self.diagnostics),
            "calibration": dict(self.calibration),
        }
