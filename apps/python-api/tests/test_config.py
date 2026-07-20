from __future__ import annotations

import pytest

from app.core.config import Settings


def test_settings_validate_internal_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PYTHON_API_INTERNAL_KEY", "short")
    with pytest.raises(RuntimeError, match="at least 32"):
        Settings.from_environment()


def test_settings_validate_positive_integers(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PYTHON_API_INTERNAL_KEY", "x" * 32)
    monkeypatch.setenv("PYTHON_API_MAX_UPLOAD_BYTES", "0")
    with pytest.raises(RuntimeError, match="must be positive"):
        Settings.from_environment()
