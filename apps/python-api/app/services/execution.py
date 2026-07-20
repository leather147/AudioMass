from __future__ import annotations

import asyncio
from collections.abc import Callable
from functools import partial
from pathlib import Path
from typing import cast

from fastapi import Request, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from starlette.concurrency import run_in_threadpool

from app.audio.io import TemporaryUpload, persist_upload
from app.core.config import get_settings


async def prepare_upload(file: UploadFile) -> TemporaryUpload:
    return await persist_upload(file, get_settings().max_upload_bytes)


async def run_cpu_bound[**P, R](
    request: Request,
    operation: Callable[P, R],
    *args: P.args,
    **kwargs: P.kwargs,
) -> R:
    limiter = cast(asyncio.Semaphore, request.app.state.processing_limiter)
    async with limiter:
        return await run_in_threadpool(partial(operation, *args, **kwargs))


def audio_file_response(
    temporary_upload: TemporaryUpload,
    output_path: Path,
    *,
    filename: str,
    media_type: str,
) -> FileResponse:
    return FileResponse(
        output_path,
        background=BackgroundTask(temporary_upload.cleanup),
        filename=filename,
        media_type=media_type,
    )
