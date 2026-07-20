from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from fastapi.responses import FileResponse

from app.audio.analyzer import analyze_audio
from app.audio.exporter import export_audio
from app.core.security import require_internal_key
from app.effects.normalize import normalize_peak
from app.schemas.audio import AudioAnalysis
from app.services.execution import (
    audio_file_response,
    prepare_upload,
    run_cpu_bound,
)

router = APIRouter(
    prefix="/audio",
    tags=["audio"],
    dependencies=[Depends(require_internal_key)],
)


@router.post("/analyze", response_model=AudioAnalysis)
async def analyze(
    request: Request,
    file: Annotated[UploadFile, File(description="WAV, FLAC, OGG, Opus, or MP3 audio")],
) -> AudioAnalysis:
    temporary = await prepare_upload(file)
    try:
        return await run_cpu_bound(request, analyze_audio, temporary.path)
    finally:
        temporary.cleanup()


@router.post("/normalize", response_class=FileResponse)
async def normalize(
    request: Request,
    file: Annotated[UploadFile, File()],
    target_peak_dbfs: Annotated[float, Form(ge=-20, le=0)] = -1,
) -> FileResponse:
    temporary = await prepare_upload(file)
    output = temporary.output_path(".wav")
    try:
        await run_cpu_bound(request, normalize_peak, temporary.path, output, target_peak_dbfs)
    except Exception:
        temporary.cleanup()
        raise
    return audio_file_response(
        temporary,
        output,
        filename="normalized.wav",
        media_type="audio/wav",
    )


@router.post("/export", response_class=FileResponse)
async def export(
    request: Request,
    file: Annotated[UploadFile, File()],
    output_format: Annotated[Literal["flac", "mp3", "ogg", "wav"], Form()] = "wav",
) -> FileResponse:
    temporary = await prepare_upload(file)
    output = temporary.output_path(f".{output_format}")
    try:
        await run_cpu_bound(request, export_audio, temporary.path, output, output_format)
    except Exception:
        temporary.cleanup()
        raise
    media_types = {
        "flac": "audio/flac",
        "mp3": "audio/mpeg",
        "ogg": "audio/ogg",
        "wav": "audio/wav",
    }
    return audio_file_response(
        temporary,
        output,
        filename=f"export.{output_format}",
        media_type=media_types[output_format],
    )
