from __future__ import annotations

from pathlib import Path

import numpy as np
import soundfile as sf
from numpy.typing import NDArray
from scipy import signal

from app.audio.io import inspect_audio

BLOCK_FRAMES = 32_768
BASE_DELAYS_SECONDS = (0.0297, 0.0371, 0.0411, 0.0437)


def _comb_coefficients(
    sample_rate: int,
    room_size: float,
    damping: float,
) -> list[tuple[NDArray[np.float64], NDArray[np.float64]]]:
    feedback = 0.82 - damping * 0.35
    coefficients: list[tuple[NDArray[np.float64], NDArray[np.float64]]] = []
    delay_scale = 0.7 + room_size * 0.8
    for delay_seconds in BASE_DELAYS_SECONDS:
        delay = max(1, round(sample_rate * delay_seconds * delay_scale))
        numerator = np.array([1.0], dtype=np.float64)
        denominator = np.zeros(delay + 1, dtype=np.float64)
        denominator[0] = 1
        denominator[-1] = -feedback
        coefficients.append((numerator, denominator))
    return coefficients


def apply_reverb(
    input_path: Path,
    output_path: Path,
    *,
    room_size: float,
    damping: float,
    wet: float,
) -> None:
    metadata = inspect_audio(input_path)
    coefficients = _comb_coefficients(metadata.sample_rate, room_size, damping)
    states: list[list[NDArray[np.float64]]] = [
        [np.zeros(len(denominator) - 1) for _numerator, denominator in coefficients]
        for _channel in range(metadata.channels)
    ]

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
        for raw_block in source.blocks(
            blocksize=BLOCK_FRAMES,
            dtype="float32",
            always_2d=True,
        ):
            block = np.asarray(raw_block, dtype=np.float64)
            reverberated = np.zeros_like(block)
            for channel in range(metadata.channels):
                for index, (numerator, denominator) in enumerate(coefficients):
                    filtered, states[channel][index] = signal.lfilter(
                        numerator,
                        denominator,
                        block[:, channel],
                        zi=states[channel][index],
                    )
                    reverberated[:, channel] += filtered
            reverberated /= len(coefficients)
            mixed = np.clip(block * (1 - wet) + reverberated * wet, -1, 1)
            destination.write(mixed.astype(np.float32))
