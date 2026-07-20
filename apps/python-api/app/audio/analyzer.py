from __future__ import annotations

from pathlib import Path

import librosa
import numpy as np
import pyloudnorm as pyln

from app.audio.io import (
    dbfs,
    finite_or_none,
    inspect_audio,
    read_feature_window,
    stream_statistics,
)
from app.schemas.audio import (
    AudioAnalysis,
    LevelMetrics,
    RhythmMetrics,
    SpectralMetrics,
)


def _mean_feature(feature: np.ndarray[tuple[int, ...], np.dtype[np.floating]]) -> float | None:
    finite = feature[np.isfinite(feature)]
    return finite_or_none(float(np.mean(finite))) if finite.size else None


def analyze_audio(path: Path) -> AudioAnalysis:
    metadata = inspect_audio(path)
    statistics = stream_statistics(path)
    mono, sample_rate, feature_window_seconds = read_feature_window(path)

    if statistics.rms > 0 and statistics.peak > 0:
        crest_factor_db = dbfs(statistics.peak / statistics.rms)
    else:
        crest_factor_db = None

    if np.max(np.abs(mono)) > 0 and len(mono) >= sample_rate // 2:
        loudness = finite_or_none(float(pyln.Meter(sample_rate).integrated_loudness(mono)))
        centroid = _mean_feature(librosa.feature.spectral_centroid(y=mono, sr=sample_rate))
        bandwidth = _mean_feature(librosa.feature.spectral_bandwidth(y=mono, sr=sample_rate))
        rolloff = _mean_feature(librosa.feature.spectral_rolloff(y=mono, sr=sample_rate))
        tempo_value, beat_frames = librosa.beat.beat_track(y=mono, sr=sample_rate)
        tempo = finite_or_none(float(np.asarray(tempo_value).reshape(-1)[0]))
        pitches, voiced, _probability = librosa.pyin(
            mono,
            fmin=50,
            fmax=min(2_000, sample_rate / 2 - 1),
            sr=sample_rate,
        )
        voiced_pitches = pitches[voiced & np.isfinite(pitches)]
        pitch = finite_or_none(float(np.median(voiced_pitches))) if voiced_pitches.size else None
        beat_count = len(beat_frames)
    else:
        loudness = None
        centroid = bandwidth = rolloff = tempo = pitch = None
        beat_count = 0

    return AudioAnalysis(
        metadata=metadata,
        levels=LevelMetrics(
            crest_factor_db=crest_factor_db,
            dc_offset=statistics.dc_offset,
            integrated_lufs=loudness,
            peak_dbfs=dbfs(statistics.peak),
            rms_dbfs=dbfs(statistics.rms),
        ),
        rhythm=RhythmMetrics(beat_count=beat_count, tempo_bpm=tempo),
        spectral=SpectralMetrics(
            bandwidth_hz=bandwidth,
            centroid_hz=centroid,
            pitch_hz=pitch,
            rolloff_hz=rolloff,
        ),
        feature_window_seconds=feature_window_seconds,
    )
