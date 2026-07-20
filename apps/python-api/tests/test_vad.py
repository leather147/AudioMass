from __future__ import annotations

from pathlib import Path

import numpy as np

from app.ai.vad import detect_voice_activity
from tests.conftest import AudioFactory


def test_voice_activity_finds_audible_region(
    tmp_path: Path,
    audio_factory: AudioFactory,
) -> None:
    sample_rate = 16_000
    silence = np.zeros(round(sample_rate * 0.3), dtype=np.float32)
    time = np.arange(round(sample_rate * 0.6), dtype=np.float32) / sample_rate
    voice = np.asarray(0.4 * np.sin(2 * np.pi * 180 * time), dtype=np.float32)
    samples = np.concatenate([silence, voice, silence])
    source = audio_factory(tmp_path / "voice.wav", samples, sample_rate)

    result = detect_voice_activity(source, sensitivity=0.6)

    assert len(result.segments) == 1
    assert 0.2 <= result.segments[0].start_seconds <= 0.4
    assert 0.8 <= result.segments[0].end_seconds <= 1.0
    assert 0.3 < result.speech_ratio < 0.7
