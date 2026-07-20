from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

MINIMUM_INTERNAL_KEY_LENGTH = 32


def _positive_int(name: str, default: int) -> int:
    raw = os.getenv(name, str(default))
    try:
        value = int(raw)
    except ValueError as error:
        raise RuntimeError(f"{name} must be an integer") from error
    if value < 1:
        raise RuntimeError(f"{name} must be positive")
    return value


def _positive_float(name: str, default: float) -> float:
    raw = os.getenv(name, str(default))
    try:
        value = float(raw)
    except ValueError as error:
        raise RuntimeError(f"{name} must be a number") from error
    if value <= 0:
        raise RuntimeError(f"{name} must be positive")
    return value


def _required_csv(name: str) -> frozenset[str]:
    values = frozenset(
        value.strip().lower() for value in os.getenv(name, "").split(",") if value.strip()
    )
    if not values:
        raise RuntimeError(f"{name} must contain at least one hostname")
    return values


def _boolean(name: str, default: bool = False) -> bool:
    raw = os.getenv(name, str(default)).strip().lower()
    if raw in {"1", "true", "yes"}:
        return True
    if raw in {"0", "false", "no"}:
        return False
    raise RuntimeError(f"{name} must be a boolean")


@dataclass(frozen=True, slots=True)
class Settings:
    internal_key: str
    allowed_storage_hosts: frozenset[str]
    allow_insecure_storage: bool
    remote_timeout_seconds: float
    whisper_compute_type: str
    whisper_device: str
    whisper_model: str
    max_concurrent_jobs: int
    max_upload_bytes: int
    log_level: str

    @classmethod
    def from_environment(cls) -> Settings:
        internal_key = os.getenv("PYTHON_API_INTERNAL_KEY", "")
        if len(internal_key) < MINIMUM_INTERNAL_KEY_LENGTH:
            raise RuntimeError(
                "PYTHON_API_INTERNAL_KEY must contain at least "
                f"{MINIMUM_INTERNAL_KEY_LENGTH} characters"
            )
        return cls(
            internal_key=internal_key,
            allowed_storage_hosts=_required_csv("PYTHON_API_ALLOWED_STORAGE_HOSTS"),
            allow_insecure_storage=_boolean("PYTHON_API_ALLOW_INSECURE_STORAGE"),
            remote_timeout_seconds=_positive_float("PYTHON_API_REMOTE_TIMEOUT_SECONDS", 900),
            max_concurrent_jobs=_positive_int("PYTHON_API_MAX_CONCURRENT_JOBS", 2),
            max_upload_bytes=_positive_int("PYTHON_API_MAX_UPLOAD_BYTES", 512 * 1024 * 1024),
            log_level=os.getenv("PYTHON_API_LOG_LEVEL", "INFO").upper(),
            whisper_compute_type=os.getenv("PYTHON_API_WHISPER_COMPUTE_TYPE", "int8"),
            whisper_device=os.getenv("PYTHON_API_WHISPER_DEVICE", "cpu"),
            whisper_model=os.getenv("PYTHON_API_WHISPER_MODEL", "small"),
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings.from_environment()
