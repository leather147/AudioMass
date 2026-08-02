from __future__ import annotations

import shutil
import subprocess
from pathlib import Path
from typing import Literal

import imageio_ffmpeg
import soundfile as sf

from app.audio.io import inspect_audio
from app.core.errors import AudioProcessingError

ExportFormat = Literal["flac", "mp3", "ogg", "wav"]

__all__ = [
    "ExportFormat",
    "export_audio",
    "ffmpeg_available",
    "imageio_ffmpeg",
    "shutil",
]

FORMAT_OPTIONS: dict[str, tuple[str, str | None]] = {
    "flac": ("FLAC", "PCM_24"),
    "ogg": ("OGG", "VORBIS"),
    "wav": ("WAV", "PCM_24"),
}


def ffmpeg_available() -> bool:
    return _ffmpeg_executable() is not None


def _ffmpeg_executable() -> str | None:
    system_executable = shutil.which("ffmpeg")
    if system_executable is not None:
        return system_executable
    try:
        bundled_executable = imageio_ffmpeg.get_ffmpeg_exe()
    except RuntimeError:
        return None
    return bundled_executable if Path(bundled_executable).is_file() else None


def export_audio(input_path: Path, output_path: Path, output_format: ExportFormat) -> None:
    if output_format == "mp3":
        _export_mp3(input_path, output_path)
        return

    metadata = inspect_audio(input_path)
    container, subtype = FORMAT_OPTIONS[output_format]
    with (
        sf.SoundFile(input_path) as source,
        sf.SoundFile(
            output_path,
            mode="w",
            samplerate=metadata.sample_rate,
            channels=metadata.channels,
            format=container,
            subtype=subtype,
        ) as destination,
    ):
        for block in source.blocks(blocksize=65_536, dtype="float32", always_2d=True):
            destination.write(block)


def _export_mp3(input_path: Path, output_path: Path) -> None:
    executable = _ffmpeg_executable()
    if executable is None:
        raise AudioProcessingError(
            "ffmpeg_unavailable",
            "MP3 export requires an available ffmpeg executable",
            status_code=503,
        )
    command = [
        executable,
        "-nostdin",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(input_path),
        "-map_metadata",
        "-1",
        "-codec:a",
        "libmp3lame",
        "-q:a",
        "2",
        "-y",
        str(output_path),
    ]
    try:
        subprocess.run(command, check=True, capture_output=True, timeout=900)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
        raise AudioProcessingError(
            "ffmpeg_failed",
            "ffmpeg could not encode the supplied audio document",
        ) from error
