from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile

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
