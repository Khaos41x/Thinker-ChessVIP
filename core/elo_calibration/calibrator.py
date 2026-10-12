from __future__ import annotations

import logging
from hashlib import sha256

from .artifact import canonical_json, payload_checksum
from .errors import (
    ArtifactChecksumMismatch,
    BudgetClassMismatch,
    EngineIdentityMismatch,
    ScaleMismatch,
)
from .interpolation import generalized_inverse, resolve_adjacent_skill, validate_curve
from .models import CalibrationArtifact, CalibrationRequest, EngineProfile


class EloCalibrator:
    def __init__(
        self,
        artifact: CalibrationArtifact,
        expected_engine_sha256: str,
        logger: logging.Logger | None = None,
    ) -> None:
        actual_checksum = payload_checksum(artifact.payload)
        if artifact.checksum != actual_checksum:
            raise ArtifactChecksumMismatch(artifact.checksum, actual_checksum)
        validate_curve(artifact.payload.anchors, artifact.payload.segments)
        if artifact.payload.engine.binary_sha256 != expected_engine_sha256:
            raise EngineIdentityMismatch(
                expected_engine_sha256, artifact.payload.engine.binary_sha256
            )
        self._artifact = artifact
        self._logger = logger or logging.getLogger(__name__)

    @property
    def artifact(self) -> CalibrationArtifact:
        return self._artifact

    def interpolate_uci_params(self, request: CalibrationRequest) -> EngineProfile:
        payload = self._artifact.payload
        if request.scale_id != payload.scale.scale_id:
            raise ScaleMismatch(payload.scale.scale_id, request.scale_id)
        if request.budget_class != payload.search_policy.budget_class:
            raise BudgetClassMismatch(
                payload.search_policy.budget_class, request.budget_class
            )
        latent_skill = generalized_inverse(
            payload.anchors,
            payload.segments,
            request.target_elo,
        )
        resolution = resolve_adjacent_skill(
            latent_skill=latent_skill,
            seed_policy_version=payload.seed_policy_version,
            artifact_checksum=self._artifact.checksum,
            runtime_game_token=request.runtime_game_token,
            target_elo=request.target_elo,
            side=request.side,
        )
        policy = payload.search_policy
        identity = {
            "appliedSkill": resolution.applied_skill,
            "artifactChecksum": self._artifact.checksum,
            "artifactVersion": payload.artifact_version,
            "budgetClass": policy.budget_class,
            "hashMb": policy.hash_mb,
            "latentSkill": resolution.latent_skill,
            "moveTimeMs": policy.move_time_ms,
            "minimumAdmissionMs": policy.minimum_admission_ms,
            "multiPv": policy.multipv,
            "ponder": policy.ponder,
            "resolutionKey": resolution.resolution_key,
            "scaleId": payload.scale.scale_id,
            "seedPolicyVersion": payload.seed_policy_version,
            "tablebases": policy.tablebases,
            "targetElo": request.target_elo,
            "threads": policy.threads,
        }
        profile_digest = sha256(canonical_json(identity)).hexdigest()
        profile = EngineProfile(
            scale_id=payload.scale.scale_id,
            target_elo=request.target_elo,
            artifact_version=payload.artifact_version,
            artifact_checksum=self._artifact.checksum,
            budget_class=policy.budget_class,
            seed_policy_version=payload.seed_policy_version,
            latent_skill=resolution.latent_skill,
            applied_skill=resolution.applied_skill,
            resolution_key=resolution.resolution_key,
            threads=policy.threads,
            hash_mb=policy.hash_mb,
            multipv=policy.multipv,
            move_time_ms=policy.move_time_ms,
            minimum_admission_ms=policy.minimum_admission_ms,
            ponder=policy.ponder,
            tablebases=policy.tablebases,
            profile_digest=profile_digest,
        )
        self._logger.info(
            "elo_profile_resolved",
            extra={
                "scale_id": profile.scale_id,
                "target_elo": profile.target_elo,
                "artifact_version": profile.artifact_version,
                "artifact_checksum": profile.artifact_checksum,
                "budget_class": profile.budget_class,
                "latent_skill": profile.latent_skill,
                "applied_skill": profile.applied_skill,
                "seed_policy_version": profile.seed_policy_version,
                "resolution_key": profile.resolution_key,
                "profile_digest": profile.profile_digest,
                "engine_sha256": payload.engine.binary_sha256,
                "threads": profile.threads,
                "hash_mb": profile.hash_mb,
                "multipv": profile.multipv,
                "move_time_ms": profile.move_time_ms,
                "minimum_admission_ms": profile.minimum_admission_ms,
            },
        )
        return profile
