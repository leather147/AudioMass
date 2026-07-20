from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, HttpUrl, model_validator

RemoteOperation = Literal[
    "analyze",
    "normalize",
    "export",
    "reverb",
    "noise-reduction",
    "plugin",
    "voice-activity",
    "transcribe",
]


class RemoteInput(BaseModel):
    url: HttpUrl
    filename: str = Field(min_length=1, max_length=255)
    headers: dict[str, str] = Field(default_factory=dict)


class RemoteOutput(BaseModel):
    url: HttpUrl
    content_type: str = Field(min_length=1, max_length=160)
    headers: dict[str, str] = Field(default_factory=dict)


class RemoteJobRequest(BaseModel):
    operation: RemoteOperation
    input: RemoteInput
    output: RemoteOutput | None = None
    parameters: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def require_output_for_audio_operations(self) -> RemoteJobRequest:
        returns_audio = self.operation in {
            "normalize",
            "export",
            "reverb",
            "noise-reduction",
            "plugin",
        }
        if returns_audio and self.output is None:
            raise ValueError(f"{self.operation} requires an output upload grant")
        if not returns_audio and self.output is not None:
            raise ValueError(f"{self.operation} does not produce an output file")
        return self


class RemoteJobResponse(BaseModel):
    operation: RemoteOperation
    result: dict[str, Any]
    output_size: int | None = Field(default=None, ge=0)
