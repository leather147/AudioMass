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


@dataclass(frozen=True, slots=True)
class Settings:
    internal_key: str
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
            max_concurrent_jobs=_positive_int("PYTHON_API_MAX_CONCURRENT_JOBS", 2),
            max_upload_bytes=_positive_int("PYTHON_API_MAX_UPLOAD_BYTES", 512 * 1024 * 1024),
            log_level=os.getenv("PYTHON_API_LOG_LEVEL", "INFO").upper(),
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings.from_environment()
