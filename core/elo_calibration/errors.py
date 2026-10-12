from __future__ import annotations


class EloCalibrationError(Exception):
    pass


class ValidationError(EloCalibrationError):
    def __init__(self, field: str, reason: str) -> None:
        self.field = field
        self.reason = reason
        super().__init__(f"{field}: {reason}")


class ArtifactValidationError(ValidationError):
    pass


class ArtifactChecksumMismatch(ArtifactValidationError):
    def __init__(self, expected: str, actual: str) -> None:
        self.expected = expected
        self.actual = actual
        super().__init__("checksum", f"expected {expected}, computed {actual}")


class UnsupportedRatingRange(EloCalibrationError):
    def __init__(self, target_elo: int, minimum: float, maximum: float) -> None:
        self.target_elo = target_elo
        self.minimum = minimum
        self.maximum = maximum
        super().__init__(
            f"targetElo {target_elo} is outside measured support [{minimum}, {maximum}]"
        )


class EngineIdentityMismatch(EloCalibrationError):
    def __init__(self, expected: str, actual: str) -> None:
        self.expected = expected
        self.actual = actual
        super().__init__(f"engine binary mismatch: expected {expected}, got {actual}")


class ScaleMismatch(ValidationError):
    def __init__(self, expected: str, actual: str) -> None:
        self.expected = expected
        self.actual = actual
        super().__init__("request.scaleId", f"expected {expected}, got {actual}")


class BudgetClassMismatch(ValidationError):
    def __init__(self, expected: str, actual: str) -> None:
        self.expected = expected
        self.actual = actual
        super().__init__("request.budgetClass", f"expected {expected}, got {actual}")


class UciContractError(EloCalibrationError):
    pass


class InjectedUciFailure(UciContractError):
    def __init__(self, operation: str) -> None:
        self.operation = operation
        super().__init__(f"injected UCI failure during {operation}")
