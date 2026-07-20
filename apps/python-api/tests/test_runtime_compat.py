from __future__ import annotations

from pathlib import Path

import lazy_loader
import pytest

from app.core.runtime_compat import install_librosa_stub_fallback


def test_librosa_stub_fallback_exposes_required_api(tmp_path: Path) -> None:
    install_librosa_stub_fallback()
    install_librosa_stub_fallback()

    _getattr, _dir, exported = lazy_loader.attach_stub(
        "librosa", str(tmp_path / "librosa" / "__init__.py")
    )

    assert {"beat", "feature", "pyin", "resample"} <= set(exported)


def test_stub_fallback_does_not_mask_other_missing_stubs(tmp_path: Path) -> None:
    install_librosa_stub_fallback()

    with pytest.raises(ValueError, match="non-existent stub"):
        lazy_loader.attach_stub("another_package", str(tmp_path / "__init__.py"))
