from __future__ import annotations

import json
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from fastapi.responses import FileResponse

from app.core.errors import AudioProcessingError
from app.core.security import require_internal_key
from app.plugins.registry import PluginManifest, plugin_registry
from app.services.execution import audio_file_response, prepare_upload, run_cpu_bound

router = APIRouter(
    prefix="/plugins",
    tags=["plugins"],
    dependencies=[Depends(require_internal_key)],
)


@router.get("", response_model=list[PluginManifest])
def list_plugins() -> list[PluginManifest]:
    return plugin_registry.manifests()


def _parse_parameters(value: str) -> dict[str, Any]:
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError as error:
        raise AudioProcessingError(
            "invalid_plugin_parameters",
            "Plugin parameters must be a JSON object",
        ) from error
    if not isinstance(parsed, dict):
        raise AudioProcessingError(
            "invalid_plugin_parameters",
            "Plugin parameters must be a JSON object",
        )
    return parsed


@router.post("/{plugin_id}/run", response_class=FileResponse)
async def run_plugin(
    plugin_id: str,
    request: Request,
    file: Annotated[UploadFile, File()],
    parameters: Annotated[str, Form()] = "{}",
) -> FileResponse:
    temporary = await prepare_upload(file)
    output = temporary.output_path()
    try:
        await run_cpu_bound(
            request,
            plugin_registry.run,
            plugin_id,
            temporary.path,
            output,
            _parse_parameters(parameters),
        )
    except Exception:
        temporary.cleanup()
        raise
    return audio_file_response(
        temporary,
        output,
        filename="plugin-output.wav",
        media_type="audio/wav",
    )
