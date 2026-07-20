from __future__ import annotations

import math
from dataclasses import dataclass
from pathlib import Path
from tempfile import TemporaryDirectory

import librosa
import numpy as np
import soundfile as sf
from fastapi import UploadFile
from numpy.typing import NDArray

from app.core.errors import AudioProcessingError
from app.schemas.audio import AudioMetadata

FloatAudio = NDArray[np.float32]
UPLOAD_CHUNK_BYTES = 1024 * 1024
FEATURE_SAMPLE_RATE = 22_050
MAX_FEATURE_SECONDS = 120
SUPPORTED_AUDIO_SUFFIXES = {".flac", ".mp3", ".ogg", ".opus", ".wav"}


@dataclass(slots=True)
class TemporaryUpload:
    directory: TemporaryDirectory[str]
    path: Path

    def output_path(self, suffix: str = ".wav") -> Path:
        return Path(self.directory.name) / f"output{suffix}"

    def cleanup(self) -> None:
        self.directory.cleanup()


@dataclass(frozen=True, slots=True)
class StreamStatistics:
    dc_offset: float
    peak: float
    rms: float


def inspect_audio(path: Path) -> AudioMetadata:
    try:
        info = sf.info(path)
    except (RuntimeError, TypeError) as error:
        raise AudioProcessingError(
            "unsupported_audio",
            "The uploaded file is not a supported or valid audio document",
        ) from error
    if info.frames <= 0 or info.samplerate <= 0 or info.channels <= 0:
        raise AudioProcessingError("empty_audio", "The audio document contains no samples")
    return AudioMetadata(
        channels=int(info.channels),
        duration_seconds=float(info.duration),
        format=str(info.format),
        frames=int(info.frames),
        sample_rate=int(info.samplerate),
        subtype=str(info.subtype),
    )


async def persist_upload(upload: UploadFile, max_bytes: int) -> TemporaryUpload:
    filename = upload.filename or ""
    suffix = Path(filename).suffix.lower()
    if suffix not in SUPPORTED_AUDIO_SUFFIXES:
        raise AudioProcessingError(
            "unsupported_extension",
            f"Supported audio extensions: {', '.join(sorted(SUPPORTED_AUDIO_SUFFIXES))}",
            status_code=415,
        )

    directory = TemporaryDirectory(prefix="audiomass-")
    path = Path(directory.name) / f"input{suffix}"
    total = 0
    try:
        with path.open("wb") as destination:
            while chunk := await upload.read(UPLOAD_CHUNK_BYTES):
                total += len(chunk)
                if total > max_bytes:
                    raise AudioProcessingError(
                        "upload_too_large",
                        f"Audio upload exceeds the {max_bytes} byte limit",
                        status_code=413,
                    )
                destination.write(chunk)
        inspect_audio(path)
    except Exception:
        directory.cleanup()
        raise
    finally:
        await upload.close()
    return TemporaryUpload(directory=directory, path=path)


def stream_statistics(path: Path) -> StreamStatistics:
    peak = 0.0
    sample_sum = 0.0
    square_sum = 0.0
    sample_count = 0
    with sf.SoundFile(path) as audio:
        for block in audio.blocks(blocksize=65_536, dtype="float32", always_2d=True):
            values = np.asarray(block, dtype=np.float64)
            peak = max(peak, float(np.max(np.abs(values))))
            sample_sum += float(np.sum(values))
            square_sum += float(np.sum(np.square(values)))
            sample_count += values.size
    if sample_count == 0:
        return StreamStatistics(dc_offset=0.0, peak=0.0, rms=0.0)
    return StreamStatistics(
        dc_offset=sample_sum / sample_count,
        peak=peak,
        rms=math.sqrt(square_sum / sample_count),
    )


def read_feature_window(path: Path) -> tuple[FloatAudio, int, float]:
    with sf.SoundFile(path) as audio:
        source_rate = int(audio.samplerate)
        frame_limit = min(len(audio), source_rate * MAX_FEATURE_SECONDS)
        samples = np.asarray(
            audio.read(frames=frame_limit, dtype="float32", always_2d=True),
            dtype=np.float32,
        )
    mono: FloatAudio = np.asarray(np.mean(samples, axis=1), dtype=np.float32)
    if source_rate != FEATURE_SAMPLE_RATE:
        mono = np.asarray(
            librosa.resample(mono, orig_sr=source_rate, target_sr=FEATURE_SAMPLE_RATE),
            dtype=np.float32,
        )
        sample_rate = FEATURE_SAMPLE_RATE
    else:
        sample_rate = source_rate
    return mono, sample_rate, len(mono) / sample_rate


def dbfs(amplitude: float) -> float | None:
    if amplitude <= 0 or not math.isfinite(amplitude):
        return None
    return 20 * math.log10(amplitude)


def finite_or_none(value: float) -> float | None:
    return value if math.isfinite(value) else None
