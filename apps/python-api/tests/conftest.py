from __future__ import annotations

import os
from collections.abc import Callable
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf
from numpy.typing import NDArray

os.environ["PYTHON_API_INTERNAL_KEY"] = "test-internal-key-with-at-least-32-characters"
os.environ["PYTHON_API_MAX_UPLOAD_BYTES"] = str(8 * 1024 * 1024)
os.environ["PYTHON_API_MAX_CONCURRENT_JOBS"] = "2"

AudioFactory = Callable[[Path, NDArray[np.float32], int], Path]


@pytest.fixture
def audio_factory() -> AudioFactory:
    def write(path: Path, samples: NDArray[np.float32], sample_rate: int) -> Path:
        sf.write(path, samples, sample_rate, subtype="FLOAT")
        return path

    return write


@pytest.fixture
def sine_wave() -> tuple[NDArray[np.float32], int]:
    sample_rate = 22_050
    time = np.arange(sample_rate, dtype=np.float32) / sample_rate
    samples = np.asarray(0.5 * np.sin(2 * np.pi * 440 * time), dtype=np.float32)
    return samples, sample_rate
