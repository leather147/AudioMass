from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from faster_whisper import WhisperModel
from pydantic import BaseModel, Field

from app.core.config import get_settings


class TranscriptSegment(BaseModel):
    start_seconds: float = Field(ge=0)
    end_seconds: float = Field(ge=0)
    text: str


class TranscriptionResponse(BaseModel):
    duration_seconds: float = Field(ge=0)
    language: str
    language_probability: float = Field(ge=0, le=1)
    text: str
    segments: list[TranscriptSegment]


@lru_cache(maxsize=1)
def _model() -> WhisperModel:
    settings = get_settings()
    return WhisperModel(
        settings.whisper_model,
        device=settings.whisper_device,
        compute_type=settings.whisper_compute_type,
    )


def transcribe_audio(
    path: Path,
    *,
    language: str | None = None,
    task: Literal["transcribe", "translate"] = "transcribe",
) -> TranscriptionResponse:
    segments_iterator, info = _model().transcribe(
        str(path),
        beam_size=5,
        language=language,
        task=task,
        vad_filter=True,
    )
    segments = [
        TranscriptSegment(
            start_seconds=float(segment.start),
            end_seconds=float(segment.end),
            text=segment.text.strip(),
        )
        for segment in segments_iterator
        if segment.text.strip()
    ]
    return TranscriptionResponse(
        duration_seconds=float(info.duration),
        language=str(info.language),
        language_probability=float(info.language_probability),
        segments=segments,
        text=" ".join(segment.text for segment in segments),
    )
