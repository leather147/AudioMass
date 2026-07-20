from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest

from app.ai import transcription


@dataclass
class FakeSegment:
    start: float
    end: float
    text: str


@dataclass
class FakeInfo:
    duration: float = 4.5
    language: str = "en"
    language_probability: float = 0.97


class FakeWhisperModel:
    def transcribe(self, _path: str, **_options: Any) -> tuple[list[FakeSegment], FakeInfo]:
        return [
            FakeSegment(0, 1.2, " Hello"),
            FakeSegment(1.3, 2.1, " world "),
            FakeSegment(2.2, 2.3, " "),
        ], FakeInfo()


def test_transcription_collects_timed_nonempty_segments(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(transcription, "_model", lambda: FakeWhisperModel())

    result = transcription.transcribe_audio(Path("speech.wav"), language="en")

    assert result.text == "Hello world"
    assert result.language == "en"
    assert result.language_probability == pytest.approx(0.97)
    assert [segment.start_seconds for segment in result.segments] == [0, 1.3]
