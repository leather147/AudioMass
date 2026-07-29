from __future__ import annotations

from pathlib import Path

from fastapi import Request

from app.ai.transcription import transcribe_audio
from app.ai.vad import detect_voice_activity
from app.audio.analyzer import analyze_audio
from app.audio.exporter import export_audio
from app.effects.noise_reduction import reduce_noise
from app.effects.normalize import normalize_peak
from app.effects.reverb import apply_reverb
from app.plugins.registry import plugin_registry
from app.schemas.jobs import (
    AnalyzeRemoteJob,
    AudioOutputResult,
    ExportRemoteJob,
    NoiseReductionRemoteJob,
    NormalizeRemoteJob,
    PluginRemoteJob,
    RemoteAudioOutputJob,
    RemoteJobRequest,
    RemoteJobResponse,
    ReverbRemoteJob,
    TranscriptionRemoteJob,
    VoiceActivityRemoteJob,
)
from app.services.execution import run_cpu_bound
from app.services.remote_io import download_remote_audio, upload_remote_output


async def execute_remote_job(request: Request, job: RemoteJobRequest) -> RemoteJobResponse:
    temporary = await download_remote_audio(job.input)
    try:
        if isinstance(job, AnalyzeRemoteJob):
            analysis = await run_cpu_bound(request, analyze_audio, temporary.path)
            return RemoteJobResponse(operation=job.operation, result=analysis)
        if isinstance(job, VoiceActivityRemoteJob):
            activity = await run_cpu_bound(
                request,
                detect_voice_activity,
                temporary.path,
                sensitivity=job.parameters.sensitivity,
            )
            return RemoteJobResponse(operation=job.operation, result=activity)
        if isinstance(job, TranscriptionRemoteJob):
            transcription = await run_cpu_bound(
                request,
                transcribe_audio,
                temporary.path,
                language=job.parameters.language,
                task=job.parameters.task,
            )
            return RemoteJobResponse(operation=job.operation, result=transcription)

        output = temporary.output_path(_output_suffix(job))
        await _process_audio(request, job, temporary.path, output)
        output_size = await upload_remote_output(job.output, output)
        return RemoteJobResponse(
            operation=job.operation,
            output_size=output_size,
            result=AudioOutputResult(content_type=job.output.content_type),
        )
    finally:
        temporary.cleanup()


def _output_suffix(job: RemoteAudioOutputJob) -> str:
    return f".{job.parameters.output_format}" if isinstance(job, ExportRemoteJob) else ".wav"


async def _process_audio(
    request: Request,
    job: RemoteAudioOutputJob,
    input_path: Path,
    output_path: Path,
) -> None:
    if isinstance(job, NormalizeRemoteJob):
        await run_cpu_bound(
            request,
            normalize_peak,
            input_path,
            output_path,
            job.parameters.target_peak_dbfs,
        )
    elif isinstance(job, ExportRemoteJob):
        await run_cpu_bound(
            request,
            export_audio,
            input_path,
            output_path,
            job.parameters.output_format,
        )
    elif isinstance(job, ReverbRemoteJob):
        await run_cpu_bound(
            request,
            apply_reverb,
            input_path,
            output_path,
            room_size=job.parameters.room_size,
            damping=job.parameters.damping,
            wet=job.parameters.wet,
        )
    elif isinstance(job, NoiseReductionRemoteJob):
        await run_cpu_bound(
            request,
            reduce_noise,
            input_path,
            output_path,
            strength=job.parameters.strength,
        )
    elif isinstance(job, PluginRemoteJob):
        await run_cpu_bound(
            request,
            plugin_registry.run,
            job.parameters.plugin_id,
            input_path,
            output_path,
            job.parameters.parameters,
        )
