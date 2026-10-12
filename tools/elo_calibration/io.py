from __future__ import annotations

import json
import os
import tempfile
from dataclasses import asdict, is_dataclass
from enum import Enum
from hashlib import sha256
from pathlib import Path
from typing import Any, Callable, TypeVar


T = TypeVar("T")


def _plain(value: Any) -> Any:
    if is_dataclass(value):
        return {key: _plain(item) for key, item in asdict(value).items()}
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, tuple):
        return [_plain(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _plain(item) for key, item in value.items()}
    return value


def canonical_json_bytes(value: Any) -> bytes:
    return json.dumps(_plain(value), ensure_ascii=False, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def content_sha256(value: Any) -> str:
    return sha256(canonical_json_bytes(value)).hexdigest()


def load_json_bytes(data: bytes) -> Any:
    def unique(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"duplicate JSON key: {key}")
            result[key] = value
        return result

    return json.loads(data.decode("utf-8"), object_pairs_hook=unique, parse_constant=lambda value: (_ for _ in ()).throw(ValueError(f"invalid constant {value}")))


def atomic_write(path: str | Path, data: bytes) -> None:
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=f".{destination.name}.", dir=destination.parent)
    try:
        with os.fdopen(descriptor, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, destination)
    except BaseException:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass
        raise


def immutable_write(path: str | Path, data: bytes) -> None:
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=f".{destination.name}.", dir=destination.parent)
    lock = destination.with_name(f".{destination.name}.lock")
    lock_descriptor: int | None = None
    try:
        with os.fdopen(descriptor, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        lock_descriptor = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        if destination.exists():
            raise FileExistsError(destination)
        os.replace(temporary, destination)
    except BaseException:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass
        raise
    finally:
        if lock_descriptor is not None:
            os.close(lock_descriptor)
            try:
                os.unlink(lock)
            except FileNotFoundError:
                pass


def write_canonical_json(path: str | Path, value: Any) -> None:
    atomic_write(path, canonical_json_bytes(value))


def write_immutable_json(path: str | Path, value: Any) -> None:
    immutable_write(path, canonical_json_bytes(value))


def load_typed(path: str | Path, decoder: Callable[[Any], T]) -> T:
    return decoder(load_json_bytes(Path(path).read_bytes()))
