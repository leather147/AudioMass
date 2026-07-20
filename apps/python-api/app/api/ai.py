from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile

from app.ai.transcription import TranscriptionResponse, transcribe_audio
from app.ai.vad import detect_voice_activity
from app.core.security import require_internal_key
from app.schemas.audio import VoiceActivityResponse
from app.services.execution import prepare_upload, run_cpu_bound

router = APIRouter(
    prefix="/ai",
    tags=["ai"],
    dependencies=[Depends(require_internal_key)],
)


@router.post("/voice-activity", response_model=VoiceActivityResponse)
async def voice_activity(
    request: Request,
    file: Annotated[UploadFile, File()],
    sensitivity: Annotated[float, Form(ge=0, le=1)] = 0.5,
) -> VoiceActivityResponse:
    temporary = await prepare_upload(file)
    try:
        return await run_cpu_bound(
            request,
            detect_voice_activity,
            temporary.path,
            sensitivity=sensitivity,
        )
    finally:
        temporary.cleanup()


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    request: Request,
    file: Annotated[UploadFile, File()],
    language: Annotated[str | None, Form(min_length=2, max_length=16)] = None,
    task: Annotated[Literal["transcribe", "translate"], Form()] = "transcribe",
) -> TranscriptionResponse:
    temporary = await prepare_upload(file)
    try:
        return await run_cpu_bound(
            request,
            transcribe_audio,
            temporary.path,
            language=language,
            task=task,
        )
    finally:
        temporary.cleanup()
