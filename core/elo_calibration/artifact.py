from __future__ import annotations

import json
from hashlib import sha256
from pathlib import Path
from typing import Any, Mapping

from .errors import ArtifactChecksumMismatch, ArtifactValidationError, ValidationError
from .interpolation import validate_curve
from .models import (
    CalibrationAnchor,
    CalibrationArtifact,
    CalibrationPayload,
    EloScale,
    EngineIdentity,
    PchipSegment,
    SearchPolicy,
)


def _exact_keys(value: Mapping[str, Any], expected: set[str], field: str) -> None:
    actual = set(value)
    if actual != expected:
        missing = sorted(expected - actual)
        extra = sorted(actual - expected)
        raise ArtifactValidationError(field, f"invalid keys; missing={missing}, extra={extra}")


def _mapping(value: Any, field: str) -> Mapping[str, Any]:
    if not isinstance(value, dict):
        raise ArtifactValidationError(field, "must be an object")
    return value


def payload_to_dict(payload: CalibrationPayload) -> dict[str, Any]:
    return {
        "anchors": [
            {"rating": anchor.rating, "skill": anchor.skill} for anchor in payload.anchors
        ],
        "artifactVersion": payload.artifact_version,
        "engine": {
            "binarySha256": payload.engine.binary_sha256,
            "name": payload.engine.name,
            "version": payload.engine.version,
        },
        "inverseConvention": payload.inverse_convention,
        "manifestSha256": payload.manifest_sha256,
        "numericSerializationVersion": payload.numeric_serialization_version,
        "scale": {
            "protocolVersion": payload.scale.protocol_version,
            "referencePool": payload.scale.reference_pool,
            "scaleId": payload.scale.scale_id,
            "timeControl": payload.scale.time_control,
        },
        "schemaVersion": payload.schema_version,
        "searchPolicy": {
            "budgetClass": payload.search_policy.budget_class,
            "clearHashBeforeSearch": payload.search_policy.clear_hash_before_search,
            "hashMb": payload.search_policy.hash_mb,
            "moveTimeMs": payload.search_policy.move_time_ms,
            "minimumAdmissionMs": payload.search_policy.minimum_admission_ms,
            "multiPv": payload.search_policy.multipv,
            "ponder": payload.search_policy.ponder,
            "tablebases": payload.search_policy.tablebases,
            "threads": payload.search_policy.threads,
            "waitReady": payload.search_policy.wait_ready,
        },
        "seedPolicyVersion": payload.seed_policy_version,
        "segments": [
            {
                "c0": segment.c0,
                "c1": segment.c1,
                "c2": segment.c2,
                "c3": segment.c3,
                "leftSkill": segment.left_skill,
                "rightSkill": segment.right_skill,
            }
            for segment in payload.segments
        ],
    }


def canonical_json(value: Mapping[str, Any]) -> bytes:
    try:
        text = json.dumps(
            value,
            ensure_ascii=False,
            allow_nan=False,
            sort_keys=True,
            separators=(",", ":"),
        )
    except (TypeError, ValueError) as error:
        raise ArtifactValidationError("json", str(error)) from error
    return text.encode("utf-8")


def payload_checksum(payload: CalibrationPayload) -> str:
    return sha256(canonical_json(payload_to_dict(payload))).hexdigest()


def create_artifact(payload: CalibrationPayload) -> CalibrationArtifact:
    validate_curve(payload.anchors, payload.segments)
    return CalibrationArtifact(payload=payload, checksum=payload_checksum(payload))


def artifact_to_bytes(artifact: CalibrationArtifact) -> bytes:
    expected = payload_checksum(artifact.payload)
    if artifact.checksum != expected:
        raise ArtifactChecksumMismatch(artifact.checksum, expected)
    return canonical_json({"checksum": artifact.checksum, "payload": payload_to_dict(artifact.payload)})


def _payload_from_dict(raw: Mapping[str, Any]) -> CalibrationPayload:
    expected = {
        "anchors",
        "artifactVersion",
        "engine",
        "inverseConvention",
        "manifestSha256",
        "numericSerializationVersion",
        "scale",
        "schemaVersion",
        "searchPolicy",
        "seedPolicyVersion",
        "segments",
    }
    _exact_keys(raw, expected, "payload")
    scale = _mapping(raw["scale"], "payload.scale")
    _exact_keys(scale, {"scaleId", "protocolVersion", "referencePool", "timeControl"}, "payload.scale")
    engine = _mapping(raw["engine"], "payload.engine")
    _exact_keys(engine, {"name", "version", "binarySha256"}, "payload.engine")
    policy = _mapping(raw["searchPolicy"], "payload.searchPolicy")
    _exact_keys(
        policy,
        {
            "budgetClass",
            "threads",
            "hashMb",
            "multiPv",
            "moveTimeMs",
            "minimumAdmissionMs",
            "clearHashBeforeSearch",
            "waitReady",
            "ponder",
            "tablebases",
        },
        "payload.searchPolicy",
    )
    anchors_raw = raw["anchors"]
    segments_raw = raw["segments"]
    if not isinstance(anchors_raw, list) or not isinstance(segments_raw, list):
        raise ArtifactValidationError("payload.curve", "anchors and segments must be arrays")
    anchors: list[CalibrationAnchor] = []
    for item in anchors_raw:
        entry = _mapping(item, "payload.anchors[]")
        _exact_keys(entry, {"skill", "rating"}, "payload.anchors[]")
        anchors.append(CalibrationAnchor(skill=entry["skill"], rating=entry["rating"]))
    segments: list[PchipSegment] = []
    for item in segments_raw:
        entry = _mapping(item, "payload.segments[]")
        _exact_keys(
            entry,
            {"leftSkill", "rightSkill", "c0", "c1", "c2", "c3"},
            "payload.segments[]",
        )
        segments.append(
            PchipSegment(
                left_skill=entry["leftSkill"],
                right_skill=entry["rightSkill"],
                c0=entry["c0"],
                c1=entry["c1"],
                c2=entry["c2"],
                c3=entry["c3"],
            )
        )
    return CalibrationPayload(
        schema_version=raw["schemaVersion"],
        artifact_version=raw["artifactVersion"],
        scale=EloScale(
            scale_id=scale["scaleId"],
            protocol_version=scale["protocolVersion"],
            reference_pool=scale["referencePool"],
            time_control=scale["timeControl"],
        ),
        engine=EngineIdentity(
            name=engine["name"],
            version=engine["version"],
            binary_sha256=engine["binarySha256"],
        ),
        manifest_sha256=raw["manifestSha256"],
        search_policy=SearchPolicy(
            budget_class=policy["budgetClass"],
            threads=policy["threads"],
            hash_mb=policy["hashMb"],
            multipv=policy["multiPv"],
            move_time_ms=policy["moveTimeMs"],
            minimum_admission_ms=policy["minimumAdmissionMs"],
            clear_hash_before_search=policy["clearHashBeforeSearch"],
            wait_ready=policy["waitReady"],
            ponder=policy["ponder"],
            tablebases=policy["tablebases"],
        ),
        seed_policy_version=raw["seedPolicyVersion"],
        numeric_serialization_version=raw["numericSerializationVersion"],
        inverse_convention=raw["inverseConvention"],
        anchors=tuple(anchors),
        segments=tuple(segments),
    )


def load_artifact_bytes(data: bytes) -> CalibrationArtifact:
    def reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in pairs:
            if key in result:
                raise ArtifactValidationError("json", f"duplicate key {key}")
            result[key] = value
        return result

    try:
        raw = json.loads(data.decode("utf-8"), object_pairs_hook=reject_duplicate_keys)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ArtifactValidationError("json", str(error)) from error
    document = _mapping(raw, "artifact")
    _exact_keys(document, {"checksum", "payload"}, "artifact")
    checksum = document["checksum"]
    try:
        payload = _payload_from_dict(_mapping(document["payload"], "artifact.payload"))
        artifact = CalibrationArtifact(payload=payload, checksum=checksum)
        validate_curve(payload.anchors, payload.segments)
        actual = payload_checksum(payload)
    except ArtifactValidationError:
        raise
    except ValidationError as error:
        raise ArtifactValidationError(error.field, error.reason) from error
    except (KeyError, TypeError, ValueError) as error:
        raise ArtifactValidationError("artifact", str(error)) from error
    if checksum != actual:
        raise ArtifactChecksumMismatch(checksum, actual)
    return artifact


def load_artifact(path: str | Path) -> CalibrationArtifact:
    return load_artifact_bytes(Path(path).read_bytes())
