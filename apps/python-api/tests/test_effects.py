from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest
import soundfile as sf
from numpy.typing import NDArray

from app.audio.io import stream_statistics
from app.core.errors import AudioProcessingError
from app.effects.noise_reduction import reduce_noise
from app.effects.normalize import normalize_peak
from app.effects.reverb import apply_reverb
from tests.conftest import AudioFactory


def test_peak_normalization_hits_requested_level(
    tmp_path: Path,
    audio_factory: AudioFactory,
    sine_wave: tuple[NDArray[np.float32], int],
) -> None:
    samples, sample_rate = sine_wave
    source = audio_factory(tmp_path / "source.wav", samples * 0.2, sample_rate)
    output = tmp_path / "normalized.wav"

    normalize_peak(source, output, -1)

    expected_peak = 10 ** (-1 / 20)
    assert stream_statistics(output).peak == pytest.approx(expected_peak, abs=2e-4)


def test_peak_normalization_rejects_silence(
    tmp_path: Path,
    audio_factory: AudioFactory,
) -> None:
    source = audio_factory(tmp_path / "silence.wav", np.zeros(8_000, dtype=np.float32), 8_000)
    with pytest.raises(AudioProcessingError, match="Silent audio"):
        normalize_peak(source, tmp_path / "output.wav", -1)


def test_reverb_preserves_shape_and_adds_tail(
    tmp_path: Path,
    audio_factory: AudioFactory,
) -> None:
    impulse = np.zeros(16_000, dtype=np.float32)
    impulse[0] = 0.5
    source = audio_factory(tmp_path / "impulse.wav", impulse, 16_000)
    output = tmp_path / "reverb.wav"

    apply_reverb(source, output, room_size=0.5, damping=0.4, wet=0.8)
    processed, sample_rate = sf.read(output, dtype="float32")

    assert sample_rate == 16_000
    assert len(processed) == len(impulse)
    assert np.count_nonzero(np.abs(processed[100:]) > 1e-5) > 3


def test_noise_reduction_returns_finite_audio(
    tmp_path: Path,
    audio_factory: AudioFactory,
    sine_wave: tuple[NDArray[np.float32], int],
) -> None:
    tone, sample_rate = sine_wave
    generator = np.random.default_rng(42)
    noisy = np.asarray(tone + generator.normal(0, 0.05, len(tone)), dtype=np.float32)
    source = audio_factory(tmp_path / "noisy.wav", noisy, sample_rate)
    output = tmp_path / "clean.wav"

    reduce_noise(source, output, strength=0.7)
    processed, _sample_rate = sf.read(output, dtype="float32")

    assert len(processed) == len(noisy)
    assert np.all(np.isfinite(processed))
    assert not np.allclose(processed, noisy, atol=1e-5)
