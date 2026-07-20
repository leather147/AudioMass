from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import urlsplit

import anyio
import httpx2

from app.audio.io import SUPPORTED_AUDIO_SUFFIXES, TemporaryUpload, inspect_audio
from app.core.config import get_settings
from app.core.errors import AudioProcessingError
from app.schemas.jobs import RemoteInput, RemoteOutput

TRANSFER_CHUNK_BYTES = 1024 * 1024


def validate_storage_url(url: str) -> None:
    settings = get_settings()
    parsed = urlsplit(url)
    if parsed.scheme != "https" and not (
        settings.allow_insecure_storage and parsed.scheme == "http"
    ):
        raise AudioProcessingError(
            "storage_url_rejected",
            "Remote storage URLs must use HTTPS",
            status_code=400,
        )
    if parsed.hostname not in settings.allowed_storage_hosts:
        raise AudioProcessingError(
            "storage_host_rejected",
            "Remote storage host is not allowlisted",
            status_code=400,
        )
    if parsed.username is not None or parsed.password is not None:
        raise AudioProcessingError(
            "storage_url_rejected",
            "Remote storage URLs cannot contain user information",
            status_code=400,
        )


async def download_remote_audio(remote: RemoteInput) -> TemporaryUpload:
    url = str(remote.url)
    validate_storage_url(url)
    suffix = Path(remote.filename).suffix.lower()
    if suffix not in SUPPORTED_AUDIO_SUFFIXES:
        raise AudioProcessingError(
            "unsupported_extension",
            f"Supported audio extensions: {', '.join(sorted(SUPPORTED_AUDIO_SUFFIXES))}",
            status_code=415,
        )

    settings = get_settings()
    directory = TemporaryDirectory(prefix="audiomass-remote-")
    path = Path(directory.name) / f"input{suffix}"
    total = 0
    try:
        timeout = httpx2.Timeout(settings.remote_timeout_seconds)
        async with (
            httpx2.AsyncClient(follow_redirects=False, timeout=timeout) as client,
            client.stream("GET", url, headers=remote.headers) as response,
        ):
            if response.status_code >= 400:
                raise AudioProcessingError(
                    "storage_download_failed",
                    f"Object storage returned HTTP {response.status_code}",
                    status_code=502,
                )
            with path.open("wb") as destination:
                async for chunk in response.aiter_bytes(TRANSFER_CHUNK_BYTES):
                    total += len(chunk)
                    if total > settings.max_upload_bytes:
                        raise AudioProcessingError(
                            "remote_object_too_large",
                            f"Remote audio exceeds the {settings.max_upload_bytes} byte limit",
                            status_code=413,
                        )
                    destination.write(chunk)
        inspect_audio(path)
    except AudioProcessingError:
        directory.cleanup()
        raise
    except httpx2.HTTPError as error:
        directory.cleanup()
        raise AudioProcessingError(
            "storage_download_failed",
            "Object storage could not be reached",
            status_code=502,
        ) from error
    except Exception:
        directory.cleanup()
        raise
    return TemporaryUpload(directory=directory, path=path)


async def _file_chunks(path: Path) -> AsyncIterator[bytes]:
    async with await anyio.open_file(path, "rb") as source:
        while chunk := await source.read(TRANSFER_CHUNK_BYTES):
            yield chunk


async def upload_remote_output(remote: RemoteOutput, path: Path) -> int:
    url = str(remote.url)
    validate_storage_url(url)
    size = (await anyio.Path(path).stat()).st_size
    if size > get_settings().max_upload_bytes:
        raise AudioProcessingError(
            "processed_audio_too_large",
            "Processed audio exceeds the configured upload limit",
            status_code=413,
        )
    headers = {**remote.headers, "content-length": str(size), "content-type": remote.content_type}
    try:
        timeout = httpx2.Timeout(get_settings().remote_timeout_seconds)
        async with httpx2.AsyncClient(follow_redirects=False, timeout=timeout) as client:
            response = await client.put(url, headers=headers, content=_file_chunks(path))
        if response.status_code >= 400:
            raise AudioProcessingError(
                "storage_upload_failed",
                f"Object storage returned HTTP {response.status_code}",
                status_code=502,
            )
    except AudioProcessingError:
        raise
    except httpx2.HTTPError as error:
        raise AudioProcessingError(
            "storage_upload_failed",
            "Object storage could not accept the processed audio",
            status_code=502,
        ) from error
    return size
