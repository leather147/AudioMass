from __future__ import annotations

import tempfile
from collections.abc import Callable
from pathlib import Path
from typing import Any

import lazy_loader

_LIBROSA_STUB = """\
from . import beat
from . import feature
from .core import pyin as pyin
from .core import resample as resample
"""


def install_librosa_stub_fallback() -> None:
    """Recover the public librosa imports if a serverless bundle omits its stub."""
    current_attach_stub = lazy_loader.attach_stub
    if getattr(current_attach_stub, "__audiomass_librosa_fallback__", False):
        return

    original_attach_stub: Callable[[str, str], tuple[Any, Any, list[str]]] = current_attach_stub

    def attach_stub_with_fallback(package_name: str, filename: str) -> tuple[Any, Any, list[str]]:
        stub_path = Path(filename if filename.endswith("i") else f"{filename}i")
        if package_name != "librosa" or stub_path.exists():
            return original_attach_stub(package_name, filename)

        fallback_dir = Path(tempfile.gettempdir()) / "audiomass-runtime"
        fallback_dir.mkdir(parents=True, exist_ok=True)
        fallback_stub = fallback_dir / "librosa.pyi"
        fallback_stub.write_text(_LIBROSA_STUB, encoding="utf-8")
        return original_attach_stub(package_name, str(fallback_stub))

    attach_stub_with_fallback.__audiomass_librosa_fallback__ = True  # type: ignore[attr-defined]
    lazy_loader.attach_stub = attach_stub_with_fallback
