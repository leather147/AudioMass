from __future__ import annotations

from pathlib import Path

import pytest

from app.audio import exporter


def test_ffmpeg_executable_prefers_system_binary(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(exporter.shutil, "which", lambda _name: "/usr/bin/ffmpeg")
    monkeypatch.setattr(
        exporter.imageio_ffmpeg,
        "get_ffmpeg_exe",
        lambda: (_ for _ in ()).throw(AssertionError("bundled lookup must not run")),
    )

    assert exporter._ffmpeg_executable() == "/usr/bin/ffmpeg"


def test_ffmpeg_executable_uses_bundled_binary(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    bundled = tmp_path / "ffmpeg"
    bundled.touch()
    monkeypatch.setattr(exporter.shutil, "which", lambda _name: None)
    monkeypatch.setattr(
        exporter.imageio_ffmpeg, "get_ffmpeg_exe", lambda: str(bundled)
    )

    assert exporter._ffmpeg_executable() == str(bundled)


def test_ffmpeg_executable_handles_missing_bundle(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(exporter.shutil, "which", lambda _name: None)
    monkeypatch.setattr(
        exporter.imageio_ffmpeg,
        "get_ffmpeg_exe",
        lambda: (_ for _ in ()).throw(RuntimeError("no binary")),
    )

    assert exporter._ffmpeg_executable() is None
