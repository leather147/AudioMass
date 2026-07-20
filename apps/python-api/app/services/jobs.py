from __future__ import annotations

from pathlib import Path
from typing import Any, Literal

from fastapi import Request
from pydantic import BaseModel, Field

from app.ai.transcription import transcribe_audio
from app.ai.vad import detect_voice_activity
from app.audio.analyzer import analyze_audio
from app.audio.exporter import export_audio
from app.effects.noise_reduction import reduce_noise
from app.effects.normalize import normalize_peak
from app.effects.reverb import apply_reverb
from app.plugins.registry import plugin_registry
from app.schemas.jobs import RemoteJobRequest, RemoteJobResponse
from app.services.execution import run_cpu_bound
from app.services.remote_io import download_remote_audio, upload_remote_output


class NormalizeParameters(BaseModel):
    target_peak_dbfs: float = Field(default=-1, ge=-20, le=0)


class ExportParameters(BaseModel):
    output_format: Literal["flac", "mp3", "ogg", "wav"] = "wav"


class ReverbParameters(BaseModel):
    room_size: float = Field(default=0.5, ge=0, le=1)
    damping: float = Field(default=0.5, ge=0, le=1)
    wet: float = Field(default=0.25, ge=0, le=1)


class NoiseReductionParameters(BaseModel):
    strength: float = Field(default=0.65, ge=0, le=1)


class PluginParameters(BaseModel):
    plugin_id: str = Field(min_length=1, max_length=160)
    parameters: dict[str, Any] = Field(default_factory=dict)


class VoiceActivityParameters(BaseModel):
    sensitivity: float = Field(default=0.5, ge=0, le=1)


class TranscriptionParameters(BaseModel):
    language: str | None = Field(default=None, min_length=2, max_length=16)
    task: Literal["transcribe", "translate"] = "transcribe"


async def execute_remote_job(request: Request, job: RemoteJobRequest) -> RemoteJobResponse:
    temporary = await download_remote_audio(job.input)
    try:
        if job.operation == "analyze":
            analysis_result = await run_cpu_bound(request, analyze_audio, temporary.path)
            return RemoteJobResponse(operation=job.operation, result=analysis_result.model_dump())
        if job.operation == "voice-activity":
            voice_parameters = VoiceActivityParameters.model_validate(job.parameters)
            activity_result = await run_cpu_bound(
                request,
                detect_voice_activity,
                temporary.path,
                sensitivity=voice_parameters.sensitivity,
            )
            return RemoteJobResponse(operation=job.operation, result=activity_result.model_dump())
        if job.operation == "transcribe":
            transcription_parameters = TranscriptionParameters.model_validate(job.parameters)
            transcript = await run_cpu_bound(
                request,
                transcribe_audio,
                temporary.path,
                language=transcription_parameters.language,
                task=transcription_parameters.task,
            )
            return RemoteJobResponse(operation=job.operation, result=transcript.model_dump())

        remote_output = job.output
        if remote_output is None:
            raise RuntimeError("Validated audio job is missing its output grant")
        output = temporary.output_path(_output_suffix(job))
        await _process_audio(request, job, temporary.path, output)
        output_size = await upload_remote_output(remote_output, output)
        return RemoteJobResponse(
            operation=job.operation,
            output_size=output_size,
            result={"content_type": remote_output.content_type},
        )
    finally:
        temporary.cleanup()


def _output_suffix(job: RemoteJobRequest) -> str:
    if job.operation == "export":
        return f".{ExportParameters.model_validate(job.parameters).output_format}"
    return ".wav"


async def _process_audio(
    request: Request,
    job: RemoteJobRequest,
    input_path: Path,
    output_path: Path,
) -> None:
    if job.operation == "normalize":
        normalize_parameters = NormalizeParameters.model_validate(job.parameters)
        await run_cpu_bound(
            request, normalize_peak, input_path, output_path, normalize_parameters.target_peak_dbfs
        )
    elif job.operation == "export":
        export_parameters = ExportParameters.model_validate(job.parameters)
        await run_cpu_bound(
            request,
            export_audio,
            input_path,
            output_path,
            export_parameters.output_format,
        )
    elif job.operation == "reverb":
        reverb_parameters = ReverbParameters.model_validate(job.parameters)
        await run_cpu_bound(
            request,
            apply_reverb,
            input_path,
            output_path,
            room_size=reverb_parameters.room_size,
            damping=reverb_parameters.damping,
            wet=reverb_parameters.wet,
        )
    elif job.operation == "noise-reduction":
        noise_parameters = NoiseReductionParameters.model_validate(job.parameters)
        await run_cpu_bound(
            request,
            reduce_noise,
            input_path,
            output_path,
            strength=noise_parameters.strength,
        )
    elif job.operation == "plugin":
        plugin_parameters = PluginParameters.model_validate(job.parameters)
        await run_cpu_bound(
            request,
            plugin_registry.run,
            plugin_parameters.plugin_id,
            input_path,
            output_path,
            plugin_parameters.parameters,
        )
