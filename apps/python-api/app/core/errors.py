from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AudioProcessingError(Exception):
    def __init__(self, code: str, message: str, *, status_code: int = 422) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


def _request_id(request: Request) -> str | None:
    value: Any = getattr(request.state, "request_id", None)
    return value if isinstance(value, str) else None


def install_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AudioProcessingError)
    async def audio_error_handler(request: Request, error: AudioProcessingError) -> JSONResponse:
        return JSONResponse(
            status_code=error.status_code,
            content={
                "error": {"code": error.code, "message": error.message},
                "request_id": _request_id(request),
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, error: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "request_validation_failed",
                    "message": "The request does not match the API contract",
                    "details": error.errors(),
                },
                "request_id": _request_id(request),
            },
        )
