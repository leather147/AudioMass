from __future__ import annotations

import io
from pathlib import Path

import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient

from app.main import app

INTERNAL_KEY = "test-internal-key-with-at-least-32-characters"


def _wave_file() -> bytes:
    output = io.BytesIO()
    sample_rate = 8_000
    time = np.arange(sample_rate, dtype=np.float32) / sample_rate
    samples = np.asarray(0.25 * np.sin(2 * np.pi * 220 * time), dtype=np.float32)
    sf.write(output, samples, sample_rate, format="WAV", subtype="FLOAT")
    return output.getvalue()


def test_health_and_openapi_are_public() -> None:
    with TestClient(app) as client:
        health = client.get("/health/live")
        schema = client.get("/openapi.json")

    assert health.status_code == 200
    assert health.json()["service"] == "audiomass-python-api"
    assert schema.status_code == 200
    assert "/v1/jobs/execute" in schema.json()["paths"]
    assert "/v1/audio/analyze" in schema.json()["paths"]
    assert "/v1/ai/transcribe" in schema.json()["paths"]
    assert "APIKeyHeader" in schema.json()["components"]["securitySchemes"]


def test_processing_routes_require_internal_key() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/v1/audio/analyze",
            files={"file": ("tone.wav", _wave_file(), "audio/wav")},
        )

    assert response.status_code == 401


def test_remote_job_route_requires_internal_key_before_fetching_storage() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/v1/jobs/execute",
            json={
                "operation": "analyze",
                "input": {
                    "filename": "tone.wav",
                    "url": "https://storage.example.com/input.wav",
                },
            },
        )

    assert response.status_code == 401


def test_analyze_route_returns_typed_metrics() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/v1/audio/analyze",
            headers={"x-internal-api-key": INTERNAL_KEY},
            files={"file": ("tone.wav", _wave_file(), "audio/wav")},
        )

    assert response.status_code == 200
    assert response.headers["x-request-id"]
    assert response.json()["metadata"]["sample_rate"] == 8_000


def test_normalize_route_streams_wav_and_cleans_temporary_files(
    tmp_path: Path,
) -> None:
    del tmp_path
    with TestClient(app) as client:
        response = client.post(
            "/v1/audio/normalize",
            headers={"x-internal-api-key": INTERNAL_KEY},
            files={"file": ("tone.wav", _wave_file(), "audio/wav")},
            data={"target_peak_dbfs": "-3"},
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("audio/wav")
    assert response.content[:4] == b"RIFF"
