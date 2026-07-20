from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import get_settings
from app.core.errors import install_exception_handlers
from app.core.logging import configure_logging, install_request_logging
from app.core.runtime_compat import install_librosa_stub_fallback


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings.log_level)
    app.state.processing_limiter = asyncio.Semaphore(settings.max_concurrent_jobs)
    yield


def create_app() -> FastAPI:
    install_librosa_stub_fallback()
    from app.api import ai, audio, effects, health, jobs, plugins

    application = FastAPI(
        title="AudioMass Python Processing API",
        summary="Bounded heavy DSP and audio analysis for the AudioMass gateway",
        version="1.0.0",
        lifespan=lifespan,
        openapi_tags=[
            {"name": "health", "description": "Container health probes"},
            {"name": "audio", "description": "Analysis, normalization, and export"},
            {"name": "effects", "description": "Server-side streaming DSP"},
            {"name": "plugins", "description": "Trusted Python audio plugin registry"},
            {"name": "ai", "description": "Machine-assisted audio analysis"},
            {"name": "jobs", "description": "Private presigned-URL processing pipeline"},
        ],
    )
    install_request_logging(application)
    install_exception_handlers(application)
    application.include_router(health.router)
    application.include_router(audio.router, prefix="/v1")
    application.include_router(effects.router, prefix="/v1")
    application.include_router(plugins.router, prefix="/v1")
    application.include_router(ai.router, prefix="/v1")
    application.include_router(jobs.router, prefix="/v1")
    return application


app = create_app()
