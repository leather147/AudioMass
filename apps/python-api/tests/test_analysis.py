from __future__ import annotations

from pathlib import Path

import numpy as np
from numpy.typing import NDArray

from app.audio.analyzer import analyze_audio
from tests.conftest import AudioFactory


def test_analyzer_reports_levels_and_pitch(
    tmp_path: Path,
    audio_factory: AudioFactory,
    sine_wave: tuple[NDArray[np.float32], int],
) -> None:
    samples, sample_rate = sine_wave
    path = audio_factory(tmp_path / "tone.wav", samples, sample_rate)

    analysis = analyze_audio(path)

    assert analysis.metadata.sample_rate == sample_rate
    assert analysis.metadata.duration_seconds == 1
    assert analysis.levels.peak_dbfs is not None
    assert -6.1 < analysis.levels.peak_dbfs < -5.9
    assert analysis.spectral.pitch_hz is not None
    assert abs(analysis.spectral.pitch_hz - 440) < 3


def test_analyzer_handles_silence(
    tmp_path: Path,
    audio_factory: AudioFactory,
) -> None:
    samples = np.zeros(22_050, dtype=np.float32)
    path = audio_factory(tmp_path / "silence.wav", samples, 22_050)

    analysis = analyze_audio(path)

    assert analysis.levels.peak_dbfs is None
    assert analysis.levels.integrated_lufs is None
    assert analysis.spectral.pitch_hz is None
