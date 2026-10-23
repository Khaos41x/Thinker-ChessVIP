import hashlib
import json
import re
import unicodedata
from dataclasses import asdict, dataclass
from urllib.parse import urlsplit

TIME_CLASSES = ("bullet", "blitz", "rapid", "daily")
SOURCES = ("pubapi-stats", "pubapi-archive", "dom-player", "dom-result")


class TrackerError(ValueError):
    def __init__(self, code, status=400, retryable=False, retry_at=None):
        super().__init__(code)
        self.code, self.status = code, status
        self.retryable, self.retry_at = retryable, retry_at

    def payload(self):
        return {"code": self.code, "retryable": self.retryable, "retryAtMs": self.retry_at,
                "source": "rating-tracker"}


def username(value):
    if not isinstance(value, str):
        raise TrackerError("INVALID_USERNAME")
    value = unicodedata.normalize("NFKC", value).strip().lower()
    if not re.fullmatch(r"[a-z0-9_-]{2,50}", value):
        raise TrackerError("INVALID_USERNAME")
    return value


def integer(value, name="rating", minimum=0, maximum=100000):
    if isinstance(value, bool) or not isinstance(value, int) or not minimum <= value <= maximum:
        raise TrackerError("INVALID_" + name.upper())
    return value


def category(value):
    if value not in TIME_CLASSES:
        raise TrackerError("INVALID_CATEGORY")
    return value


def timestamp(value):
    return integer(value, "timestamp", 0, 9007199254740991)


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def digest(value):
    return hashlib.sha256(canonical(value).encode("utf-8")).hexdigest()


def game_key(value, time_class=None):
    if not isinstance(value, str) or len(value) > 300:
        raise TrackerError("INVALID_GAME")
    if re.fullmatch(r"chesscom:(live|daily|unknown):[0-9]+", value):
        return value
    try:
        url = urlsplit(value)
        invalid = url.hostname not in ("chess.com", "www.chess.com") or url.scheme != "https" or url.username or url.password or url.port not in (None, 443)
    except ValueError as exc:
        raise TrackerError("INVALID_GAME") from exc
    if invalid:
        raise TrackerError("INVALID_GAME")
    match = re.fullmatch(r"/(?:game/(live|daily)/|(?:(live)/game/)|game/)([0-9]+)/?", url.path)
    if not match:
        raise TrackerError("INVALID_GAME")
    namespace = match[1] or match[2] or ("daily" if time_class == "daily" else "unknown")
    return "chesscom:" + namespace + ":" + match[3]


@dataclass(frozen=True)
class RatingObservation:
    accountKey: str
    usernameCanonical: str
    timeClass: str
    rating: int
    source: str
    observedAtMs: int
    sourceEffectiveAtMs: int | None
    resourceKey: str
    gameKey: str | None = None
    recordDigest: str = ""
    requestGeneration: int = 0

    def __post_init__(self):
        username(self.usernameCanonical)
        category(self.timeClass)
        integer(self.rating)
        timestamp(self.observedAtMs)
        if self.source not in SOURCES:
            raise TrackerError("INVALID_SOURCE")
        if self.sourceEffectiveAtMs is not None:
            timestamp(self.sourceEffectiveAtMs)

    def to_dict(self):
        result = asdict(self)
        identity = {key: result[key] for key in ("source", "resourceKey", "usernameCanonical", "timeClass", "rating", "sourceEffectiveAtMs", "gameKey", "recordDigest")}
        identity.update(schemaVersion=1, platform="chesscom", rules="chess")
        result.update(schemaVersion=1, observationId=digest(identity), platform="chesscom", rules="chess",
                      verification="provisional" if self.source.startswith("dom-") else "verified")
        return result


@dataclass(frozen=True)
class PlayerIdentity:
    accountKey: str
    usernameCanonical: str
    displayUsername: str
    playerId: int | None
    identityStatus: str

    def __post_init__(self):
        username(self.usernameCanonical)
        if self.playerId is not None:
            integer(self.playerId, "player_id", 1, 9007199254740991)
        if self.identityStatus not in ("verified", "unverified", "conflict"):
            raise TrackerError("INVALID_IDENTITY_STATUS")


@dataclass(frozen=True)
class RatingCategory:
    timeClass: str
    platform: str = "chesscom"
    rules: str = "chess"

    def __post_init__(self):
        category(self.timeClass)
        if self.platform != "chesscom" or self.rules != "chess":
            raise TrackerError("INVALID_CATEGORY")


@dataclass(frozen=True)
class RatingGoal:
    username: str
    timeClass: str
    direction: str
    threshold: int
    idempotencyKey: str

    def __post_init__(self):
        username(self.username)
        category(self.timeClass)
        integer(self.threshold, "threshold")
        if self.direction not in ("at-least", "at-most"):
            raise TrackerError("INVALID_DIRECTION")
        if not isinstance(self.idempotencyKey, str) or not 8 <= len(self.idempotencyKey) <= 128:
            raise TrackerError("INVALID_IDEMPOTENCY_KEY")
