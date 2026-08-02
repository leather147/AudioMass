from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, TypeAdapter, model_validator

from app.ai.transcription import TranscriptionResponse
from app.schemas.audio import AudioAnalysis, VoiceActivityResponse

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


class StrictParameters(BaseModel):
    model_config = ConfigDict(extra="forbid")


class EmptyParameters(StrictParameters):
    pass


class NormalizeParameters(StrictParameters):
    target_peak_dbfs: float = Field(default=-1, ge=-20, le=0)


class ExportParameters(StrictParameters):
    output_format: Literal["flac", "mp3", "ogg", "wav"] = "wav"


class ReverbParameters(StrictParameters):
    room_size: float = Field(default=0.5, ge=0, le=1)
    damping: float = Field(default=0.5, ge=0, le=1)
    wet: float = Field(default=0.25, ge=0, le=1)


class NoiseReductionParameters(StrictParameters):
    strength: float = Field(default=0.65, ge=0, le=1)


class PluginParameters(StrictParameters):
    plugin_id: str = Field(min_length=1, max_length=160)
    parameters: dict[str, Any] = Field(default_factory=dict)


class VoiceActivityParameters(StrictParameters):
    sensitivity: float = Field(default=0.5, ge=0, le=1)


class TranscriptionParameters(StrictParameters):
    language: str | None = Field(default=None, min_length=2, max_length=16)
    task: Literal["transcribe", "translate"] = "transcribe"


class RemoteInput(BaseModel):
    url: HttpUrl
    filename: str = Field(min_length=1, max_length=255)
    headers: dict[str, str] = Field(default_factory=dict)


class RemoteOutput(BaseModel):
    url: HttpUrl
    content_type: str = Field(min_length=1, max_length=160)
    headers: dict[str, str] = Field(default_factory=dict)


class RemoteJobBase(BaseModel):
    input: RemoteInput

    @model_validator(mode="before")
    @classmethod
    def validate_output_contract(cls, data: object) -> object:
        if not isinstance(data, dict):
            return data
        operation = data.get("operation")
        output = data.get("output")
        if (
            operation
            in {
                "normalize",
                "export",
                "reverb",
                "noise-reduction",
                "plugin",
            }
            and output is None
        ):
            raise ValueError(f"Operation '{operation}' requires an output upload grant")
        if operation in {"analyze", "voice-activity", "transcribe"} and output is not None:
            raise ValueError(f"Operation '{operation}' does not produce an output file")
        return data


class AnalyzeRemoteJob(RemoteJobBase):
    operation: Literal["analyze"]
    parameters: EmptyParameters = Field(default_factory=EmptyParameters)
    output: None = None


class NormalizeRemoteJob(RemoteJobBase):
    operation: Literal["normalize"]
    parameters: NormalizeParameters = Field(default_factory=NormalizeParameters)
    output: RemoteOutput


class ExportRemoteJob(RemoteJobBase):
    operation: Literal["export"]
    parameters: ExportParameters = Field(default_factory=ExportParameters)
    output: RemoteOutput


class ReverbRemoteJob(RemoteJobBase):
    operation: Literal["reverb"]
    parameters: ReverbParameters = Field(default_factory=ReverbParameters)
    output: RemoteOutput


class NoiseReductionRemoteJob(RemoteJobBase):
    operation: Literal["noise-reduction"]
    parameters: NoiseReductionParameters = Field(default_factory=NoiseReductionParameters)
    output: RemoteOutput


class PluginRemoteJob(RemoteJobBase):
    operation: Literal["plugin"]
    parameters: PluginParameters
    output: RemoteOutput


class VoiceActivityRemoteJob(RemoteJobBase):
    operation: Literal["voice-activity"]
    parameters: VoiceActivityParameters = Field(default_factory=VoiceActivityParameters)
    output: None = None


class TranscriptionRemoteJob(RemoteJobBase):
    operation: Literal["transcribe"]
    parameters: TranscriptionParameters = Field(default_factory=TranscriptionParameters)
    output: None = None


type RemoteJobRequest = Annotated[
    AnalyzeRemoteJob
    | NormalizeRemoteJob
    | ExportRemoteJob
    | ReverbRemoteJob
    | NoiseReductionRemoteJob
    | PluginRemoteJob
    | VoiceActivityRemoteJob
    | TranscriptionRemoteJob,
    Field(discriminator="operation"),
]

REMOTE_JOB_REQUEST_ADAPTER: TypeAdapter[RemoteJobRequest] = TypeAdapter(RemoteJobRequest)


def parse_remote_job_request(data: object) -> RemoteJobRequest:
    """Validate an internal job payload outside FastAPI dependency injection."""

    return REMOTE_JOB_REQUEST_ADAPTER.validate_python(data)


type RemoteAudioOutputJob = (
    NormalizeRemoteJob
    | ExportRemoteJob
    | ReverbRemoteJob
    | NoiseReductionRemoteJob
    | PluginRemoteJob
)


class AudioOutputResult(BaseModel):
    content_type: str


type RemoteJobResult = (
    AudioAnalysis | VoiceActivityResponse | TranscriptionResponse | AudioOutputResult
)


class RemoteJobResponse(BaseModel):
    operation: RemoteOperation
    result: RemoteJobResult
    output_size: int | None = Field(default=None, ge=0)
