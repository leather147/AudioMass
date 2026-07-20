from __future__ import annotations

from pathlib import Path

import numpy as np
import soundfile as sf
from numpy.typing import NDArray
from scipy import signal

from app.audio.io import FloatAudio, inspect_audio

FFT_SIZE = 2_048
FFT_OVERLAP = 1_536
CORE_CHUNK_FRAMES = 131_072
CONTEXT_FRAMES = 4_096


def _noise_profiles(source: sf.SoundFile) -> list[NDArray[np.float64]]:
    source.seek(0)
    noise_frames = min(len(source), int(source.samplerate))
    sample = np.asarray(
        source.read(noise_frames, dtype="float32", always_2d=True),
        dtype=np.float64,
    )
    profiles: list[NDArray[np.float64]] = []
    for channel in range(source.channels):
        _frequencies, _times, spectrum = signal.stft(
            sample[:, channel],
            fs=source.samplerate,
            nperseg=FFT_SIZE,
            noverlap=FFT_OVERLAP,
            boundary="zeros",
        )
        profiles.append(np.median(np.abs(spectrum), axis=1))
    return profiles


def _spectral_gate(
    samples: NDArray[np.float64],
    sample_rate: int,
    profile: NDArray[np.float64],
    strength: float,
) -> NDArray[np.float64]:
    _frequencies, _times, spectrum = signal.stft(
        samples,
        fs=sample_rate,
        nperseg=FFT_SIZE,
        noverlap=FFT_OVERLAP,
        boundary="zeros",
    )
    magnitude = np.abs(spectrum)
    threshold = profile[:, np.newaxis] * (1.5 + 4.5 * strength)
    attenuation_floor = 1 - strength * 0.95
    mask = np.clip((magnitude - threshold) / (magnitude + 1e-12), attenuation_floor, 1)
    _times, restored = signal.istft(
        spectrum * mask,
        fs=sample_rate,
        nperseg=FFT_SIZE,
        noverlap=FFT_OVERLAP,
        input_onesided=True,
        boundary=True,
    )
    if len(restored) < len(samples):
        restored = np.pad(restored, (0, len(samples) - len(restored)))
    return np.asarray(restored[: len(samples)], dtype=np.float64)


def reduce_noise(input_path: Path, output_path: Path, *, strength: float) -> None:
    metadata = inspect_audio(input_path)
    with sf.SoundFile(input_path) as source:
        profiles = _noise_profiles(source)
        with sf.SoundFile(
            output_path,
            mode="w",
            samplerate=metadata.sample_rate,
            channels=metadata.channels,
            format="WAV",
            subtype="PCM_24",
        ) as destination:
            core_start = 0
            while core_start < metadata.frames:
                read_start = max(0, core_start - CONTEXT_FRAMES)
                core_stop = min(metadata.frames, core_start + CORE_CHUNK_FRAMES)
                read_stop = min(metadata.frames, core_stop + CONTEXT_FRAMES)
                source.seek(read_start)
                raw = source.read(read_stop - read_start, dtype="float32", always_2d=True)
                chunk = np.asarray(raw, dtype=np.float64)
                processed = np.empty_like(chunk)
                for channel in range(metadata.channels):
                    processed[:, channel] = _spectral_gate(
                        chunk[:, channel],
                        metadata.sample_rate,
                        profiles[channel],
                        strength,
                    )
                crop_start = core_start - read_start
                crop_stop = crop_start + (core_stop - core_start)
                output: FloatAudio = np.asarray(
                    np.clip(processed[crop_start:crop_stop], -1, 1),
                    dtype=np.float32,
                )
                destination.write(output)
                core_start = core_stop
