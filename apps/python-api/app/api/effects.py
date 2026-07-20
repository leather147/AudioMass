from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from fastapi.responses import FileResponse

from app.core.security import require_internal_key
from app.effects.noise_reduction import reduce_noise
from app.effects.reverb import apply_reverb
from app.services.execution import audio_file_response, prepare_upload, run_cpu_bound

router = APIRouter(
    prefix="/effects",
    tags=["effects"],
    dependencies=[Depends(require_internal_key)],
)


@router.post("/reverb", response_class=FileResponse)
async def reverb(
    request: Request,
    file: Annotated[UploadFile, File()],
    room_size: Annotated[float, Form(ge=0, le=1)] = 0.5,
    damping: Annotated[float, Form(ge=0, le=1)] = 0.5,
    wet: Annotated[float, Form(ge=0, le=1)] = 0.25,
) -> FileResponse:
    temporary = await prepare_upload(file)
    output = temporary.output_path()
    try:
        await run_cpu_bound(
            request,
            apply_reverb,
            temporary.path,
            output,
            room_size=room_size,
            damping=damping,
            wet=wet,
        )
    except Exception:
        temporary.cleanup()
        raise
    return audio_file_response(
        temporary,
        output,
        filename="reverb.wav",
        media_type="audio/wav",
    )


@router.post("/noise-reduction", response_class=FileResponse)
async def noise_reduction(
    request: Request,
    file: Annotated[UploadFile, File()],
    strength: Annotated[float, Form(ge=0, le=1)] = 0.65,
) -> FileResponse:
    temporary = await prepare_upload(file)
    output = temporary.output_path()
    try:
        await run_cpu_bound(
            request,
            reduce_noise,
            temporary.path,
            output,
            strength=strength,
        )
    except Exception:
        temporary.cleanup()
        raise
    return audio_file_response(
        temporary,
        output,
        filename="noise-reduced.wav",
        media_type="audio/wav",
    )
