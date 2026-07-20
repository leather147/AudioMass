from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import soundfile as sf

from app.audio.io import inspect_audio
from app.schemas.audio import VoiceActivityResponse, VoiceSegment

FRAME_SECONDS = 0.03
MIN_SPEECH_SECONDS = 0.12
MERGE_GAP_SECONDS = 0.18


def _frame_levels(path: Path) -> tuple[np.ndarray[tuple[int], np.dtype[np.float64]], int]:
    levels: list[float] = []
    with sf.SoundFile(path) as audio:
        frame_size = max(1, round(audio.samplerate * FRAME_SECONDS))
        for raw in audio.blocks(blocksize=frame_size, dtype="float32", always_2d=True):
            mono = np.mean(np.asarray(raw, dtype=np.float64), axis=1)
            rms = math.sqrt(float(np.mean(np.square(mono)))) if mono.size else 0
            levels.append(20 * math.log10(max(rms, 1e-12)))
    return np.asarray(levels, dtype=np.float64), frame_size


def _active_ranges(active: np.ndarray[tuple[int], np.dtype[np.bool_]]) -> list[tuple[int, int]]:
    ranges: list[tuple[int, int]] = []
    start: int | None = None
    for index, is_active in enumerate(active):
        if is_active and start is None:
            start = index
        elif not is_active and start is not None:
            ranges.append((start, index))
            start = None
    if start is not None:
        ranges.append((start, len(active)))
    return ranges


def _merge_ranges(ranges: list[tuple[int, int]]) -> list[tuple[int, int]]:
    if not ranges:
        return []
    maximum_gap = math.ceil(MERGE_GAP_SECONDS / FRAME_SECONDS)
    merged = [ranges[0]]
    for start, stop in ranges[1:]:
        previous_start, previous_stop = merged[-1]
        if start - previous_stop <= maximum_gap:
            merged[-1] = (previous_start, stop)
        else:
            merged.append((start, stop))
    minimum_frames = math.ceil(MIN_SPEECH_SECONDS / FRAME_SECONDS)
    return [(start, stop) for start, stop in merged if stop - start >= minimum_frames]


def detect_voice_activity(path: Path, *, sensitivity: float) -> VoiceActivityResponse:
    metadata = inspect_audio(path)
    levels, _frame_size = _frame_levels(path)
    if levels.size == 0:
        return VoiceActivityResponse(
            duration_seconds=metadata.duration_seconds,
            segments=[],
            speech_ratio=0,
            threshold_dbfs=-45,
        )

    noise_floor = float(np.percentile(levels, 20))
    margin_db = 14 - sensitivity * 10
    threshold = min(-18.0, max(-55.0, noise_floor + margin_db))
    ranges = _merge_ranges(_active_ranges(levels >= threshold))
    segments = [
        VoiceSegment(
            start_seconds=start * FRAME_SECONDS,
            end_seconds=min(stop * FRAME_SECONDS, metadata.duration_seconds),
        )
        for start, stop in ranges
    ]
    speech_duration = sum(segment.end_seconds - segment.start_seconds for segment in segments)
    ratio = speech_duration / metadata.duration_seconds if metadata.duration_seconds else 0
    return VoiceActivityResponse(
        duration_seconds=metadata.duration_seconds,
        segments=segments,
        speech_ratio=min(1, max(0, ratio)),
        threshold_dbfs=threshold,
    )
