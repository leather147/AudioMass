from __future__ import annotations

from fastapi import APIRouter

from app.audio.exporter import ffmpeg_available
from app.schemas.audio import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live", response_model=HealthResponse)
def liveness() -> HealthResponse:
    return HealthResponse()


@router.get("/ready", response_model=HealthResponse)
def readiness() -> HealthResponse:
    return HealthResponse(ffmpeg_available=ffmpeg_available())
