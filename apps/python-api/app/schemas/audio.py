from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class AudioMetadata(BaseModel):
    channels: int = Field(ge=1)
    duration_seconds: float = Field(ge=0)
    frames: int = Field(ge=0)
    sample_rate: int = Field(gt=0)
    format: str
    subtype: str


class LevelMetrics(BaseModel):
    crest_factor_db: float | None
    dc_offset: float
    integrated_lufs: float | None
    peak_dbfs: float | None
    rms_dbfs: float | None


class SpectralMetrics(BaseModel):
    bandwidth_hz: float | None
    centroid_hz: float | None
    pitch_hz: float | None
    rolloff_hz: float | None


class RhythmMetrics(BaseModel):
    beat_count: int = Field(ge=0)
    tempo_bpm: float | None


class AudioAnalysis(BaseModel):
    metadata: AudioMetadata
    levels: LevelMetrics
    spectral: SpectralMetrics
    rhythm: RhythmMetrics
    feature_window_seconds: float = Field(ge=0)


class VoiceSegment(BaseModel):
    start_seconds: float = Field(ge=0)
    end_seconds: float = Field(ge=0)


class VoiceActivityResponse(BaseModel):
    duration_seconds: float = Field(ge=0)
    speech_ratio: float = Field(ge=0, le=1)
    threshold_dbfs: float
    segments: list[VoiceSegment]


class HealthResponse(BaseModel):
    service: Literal["audiomass-python-api"] = "audiomass-python-api"
    status: Literal["ok"] = "ok"
    ffmpeg_available: bool | None = None
