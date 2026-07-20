from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import soundfile as sf

from app.audio.io import inspect_audio, stream_statistics
from app.core.errors import AudioProcessingError

BLOCK_FRAMES = 65_536


def normalize_peak(input_path: Path, output_path: Path, target_peak_dbfs: float) -> None:
    metadata = inspect_audio(input_path)
    peak = stream_statistics(input_path).peak
    if peak <= 0:
        raise AudioProcessingError("silent_audio", "Silent audio cannot be peak-normalized")

    target_amplitude = 10 ** (target_peak_dbfs / 20)
    gain = target_amplitude / peak
    if not math.isfinite(gain):
        raise AudioProcessingError("invalid_gain", "Normalization gain is not finite")

    with (
        sf.SoundFile(input_path) as source,
        sf.SoundFile(
            output_path,
            mode="w",
            samplerate=metadata.sample_rate,
            channels=metadata.channels,
            format="WAV",
            subtype="PCM_24",
        ) as destination,
    ):
        for block in source.blocks(blocksize=BLOCK_FRAMES, dtype="float32", always_2d=True):
            normalized = np.clip(np.asarray(block) * gain, -1, 1)
            destination.write(normalized)
