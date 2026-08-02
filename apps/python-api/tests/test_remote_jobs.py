from __future__ import annotations

import asyncio
import io
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any, cast

import anyio
import httpx2
import numpy as np
import pytest
import soundfile as sf
from pydantic import BaseModel, ValidationError

from app.ai.transcription import TranscriptionResponse
from app.audio.io import TemporaryUpload
from app.schemas.audio import (
    AudioAnalysis,
    AudioMetadata,
    LevelMetrics,
    RhythmMetrics,
    SpectralMetrics,
    VoiceActivityResponse,
)
from app.schemas.jobs import (
    RemoteAudioOutputJob,
    RemoteInput,
    RemoteJobRequest,
    RemoteOutput,
    parse_remote_job_request,
)
from app.services import jobs, remote_io


def _wave_bytes() -> bytes:
    output = io.BytesIO()
    samples = np.zeros(800, dtype=np.float32)
    sf.write(output, samples, 8_000, format="WAV", subtype="FLOAT")
    return output.getvalue()


def test_remote_job_contract_requires_output_only_for_audio_results() -> None:
    source = {"filename": "input.wav", "url": "https://storage.example.com/input.wav"}
    with pytest.raises(ValidationError, match="requires an output upload grant"):
        parse_remote_job_request({"operation": "normalize", "input": source})
    with pytest.raises(ValidationError, match="does not produce an output file"):
        parse_remote_job_request(
            {
                "operation": "analyze",
                "input": source,
                "output": {
                    "content_type": "audio/wav",
                    "url": "https://storage.example.com/output.wav",
                },
            }
        )


def test_storage_url_validation_blocks_ssrf_targets(monkeypatch: pytest.MonkeyPatch) -> None:
    with pytest.raises(Exception, match="allowlisted"):
        remote_io.validate_storage_url("https://127.0.0.1/private.wav")
    with pytest.raises(Exception, match="HTTPS"):
        remote_io.validate_storage_url("http://storage.example.com/input.wav")

    monkeypatch.setenv("PYTHON_API_ALLOW_INSECURE_STORAGE", "true")
    remote_io.get_settings.cache_clear()
    try:
        remote_io.validate_storage_url("http://storage.example.com/input.wav")
    finally:
        remote_io.get_settings.cache_clear()


def test_remote_transfer_streams_download_and_upload(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    uploaded = bytearray()

    async def handler(request: httpx2.Request) -> httpx2.Response:
        if request.method == "GET":
            return httpx2.Response(200, content=_wave_bytes())
        uploaded.extend(await request.aread())
        return httpx2.Response(200)

    transport = httpx2.MockTransport(handler)
    real_client = httpx2.AsyncClient
    monkeypatch.setattr(
        remote_io.httpx2,
        "AsyncClient",
        lambda **options: real_client(transport=transport, **options),
    )

    remote = RemoteInput(
        filename="input.wav",
        url="https://storage.example.com/input.wav",
    )
    temporary = asyncio.run(remote_io.download_remote_audio(remote))
    try:
        assert temporary.path.stat().st_size == len(_wave_bytes())
    finally:
        temporary.cleanup()

    output = tmp_path / "output.wav"
    output.write_bytes(b"processed-audio")
    size = asyncio.run(
        remote_io.upload_remote_output(
            RemoteOutput(
                content_type="audio/wav",
                headers={"x-upload-token": "signed"},
                url="https://storage.example.com/output.wav",
            ),
            output,
        )
    )
    assert size == len(b"processed-audio")
    assert bytes(uploaded) == b"processed-audio"


def _metadata_result(operation: str) -> BaseModel:
    if operation == "analyze":
        return AudioAnalysis(
            metadata=AudioMetadata(
                channels=1,
                duration_seconds=1,
                frames=8_000,
                sample_rate=8_000,
                format="WAV",
                subtype="FLOAT",
            ),
            levels=LevelMetrics(
                crest_factor_db=0,
                dc_offset=0,
                integrated_lufs=None,
                peak_dbfs=-1,
                rms_dbfs=-2,
            ),
            spectral=SpectralMetrics(
                bandwidth_hz=0,
                centroid_hz=0,
                pitch_hz=None,
                rolloff_hz=0,
            ),
            rhythm=RhythmMetrics(beat_count=0, tempo_bpm=None),
            feature_window_seconds=1,
        )
    if operation == "voice-activity":
        return VoiceActivityResponse(
            duration_seconds=1,
            speech_ratio=0,
            threshold_dbfs=-40,
            segments=[],
        )
    return TranscriptionResponse(
        duration_seconds=1,
        language="en",
        language_probability=1,
        text="",
        segments=[],
    )


def _temporary_input() -> TemporaryUpload:
    directory = TemporaryDirectory(prefix="audiomass-test-job-")
    path = Path(directory.name) / "input.wav"
    path.write_bytes(b"input")
    return TemporaryUpload(directory=directory, path=path)


@pytest.mark.parametrize("operation", ["analyze", "voice-activity", "transcribe"])
def test_metadata_jobs_return_structured_results(
    operation: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def fake_download(_remote: RemoteInput) -> TemporaryUpload:
        return _temporary_input()

    expected = _metadata_result(operation)

    async def fake_run(*_args: Any, **_kwargs: Any) -> BaseModel:
        return expected

    monkeypatch.setattr(jobs, "download_remote_audio", fake_download)
    monkeypatch.setattr(jobs, "run_cpu_bound", fake_run)
    request = parse_remote_job_request(
        {
            "operation": operation,
            "input": {
                "filename": "input.wav",
                "url": "https://storage.example.com/input.wav",
            },
        }
    )

    result = asyncio.run(jobs.execute_remote_job(cast(Any, object()), request))
    assert result.result == expected
    assert result.output_size is None


def test_audio_job_uploads_processed_result(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_download(_remote: RemoteInput) -> TemporaryUpload:
        return _temporary_input()

    async def fake_process(
        _request: Any,
        _job: RemoteJobRequest,
        _input_path: Path,
        output_path: Path,
    ) -> None:
        await anyio.Path(output_path).write_bytes(b"wav")

    async def fake_upload(_remote: RemoteOutput, path: Path) -> int:
        return (await anyio.Path(path).stat()).st_size

    monkeypatch.setattr(jobs, "download_remote_audio", fake_download)
    monkeypatch.setattr(jobs, "_process_audio", fake_process)
    monkeypatch.setattr(jobs, "upload_remote_output", fake_upload)
    request = parse_remote_job_request(
        {
            "operation": "normalize",
            "input": {
                "filename": "input.wav",
                "url": "https://storage.example.com/input.wav",
            },
            "output": {
                "content_type": "audio/wav",
                "url": "https://storage.example.com/output.wav",
            },
        }
    )

    result = asyncio.run(jobs.execute_remote_job(cast(Any, object()), request))
    assert result.output_size == 3
    assert result.result.model_dump() == {"content_type": "audio/wav"}


@pytest.mark.parametrize(
    ("operation", "parameters"),
    [
        ("normalize", {"target_peak_dbfs": -3}),
        ("export", {"output_format": "flac"}),
        ("reverb", {"room_size": 0.2, "damping": 0.3, "wet": 0.4}),
        ("noise-reduction", {"strength": 0.5}),
        ("plugin", {"plugin_id": "audio.normalize-peak", "parameters": {}}),
    ],
)
def test_audio_operation_parameters_are_dispatched(
    operation: str,
    parameters: dict[str, Any],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[str] = []

    async def fake_run(_request: Any, function: Any, *_args: Any, **_kwargs: Any) -> None:
        calls.append(function.__name__)

    monkeypatch.setattr(jobs, "run_cpu_bound", fake_run)
    job = parse_remote_job_request(
        {
            "operation": operation,
            "input": {
                "filename": "input.wav",
                "url": "https://storage.example.com/input.wav",
            },
            "output": {
                "content_type": "audio/wav",
                "url": "https://storage.example.com/output.wav",
            },
            "parameters": parameters,
        }
    )
    asyncio.run(
        jobs._process_audio(
            cast(Any, object()),
            cast(RemoteAudioOutputJob, job),
            Path("input.wav"),
            Path("output.wav"),
        )
    )
    assert len(calls) == 1
