from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, ClassVar

from pydantic import BaseModel, Field, ValidationError

from app.core.errors import AudioProcessingError
from app.effects.noise_reduction import reduce_noise
from app.effects.normalize import normalize_peak
from app.effects.reverb import apply_reverb


class PluginManifest(BaseModel):
    id: str
    name: str
    version: str
    parameter_schema: dict[str, Any]


class PythonAudioPlugin(ABC):
    id: ClassVar[str]
    name: ClassVar[str]
    version: ClassVar[str] = "1.0.0"
    parameters_model: ClassVar[type[BaseModel]]

    def manifest(self) -> PluginManifest:
        return PluginManifest(
            id=self.id,
            name=self.name,
            version=self.version,
            parameter_schema=self.parameters_model.model_json_schema(),
        )

    @abstractmethod
    def process(self, input_path: Path, output_path: Path, parameters: BaseModel) -> None:
        raise NotImplementedError


class NormalizeParameters(BaseModel):
    target_peak_dbfs: float = Field(default=-1, ge=-20, le=0)


class NormalizePlugin(PythonAudioPlugin):
    id = "audio.normalize-peak"
    name = "Peak normalization"
    parameters_model = NormalizeParameters

    def process(self, input_path: Path, output_path: Path, parameters: BaseModel) -> None:
        parsed = NormalizeParameters.model_validate(parameters)
        normalize_peak(input_path, output_path, parsed.target_peak_dbfs)


class ReverbParameters(BaseModel):
    room_size: float = Field(default=0.5, ge=0, le=1)
    damping: float = Field(default=0.5, ge=0, le=1)
    wet: float = Field(default=0.25, ge=0, le=1)


class ReverbPlugin(PythonAudioPlugin):
    id = "audio.schroeder-reverb"
    name = "Schroeder reverb"
    parameters_model = ReverbParameters

    def process(self, input_path: Path, output_path: Path, parameters: BaseModel) -> None:
        parsed = ReverbParameters.model_validate(parameters)
        apply_reverb(
            input_path,
            output_path,
            room_size=parsed.room_size,
            damping=parsed.damping,
            wet=parsed.wet,
        )


class NoiseReductionParameters(BaseModel):
    strength: float = Field(default=0.65, ge=0, le=1)


class NoiseReductionPlugin(PythonAudioPlugin):
    id = "audio.spectral-noise-reduction"
    name = "Spectral noise reduction"
    parameters_model = NoiseReductionParameters

    def process(self, input_path: Path, output_path: Path, parameters: BaseModel) -> None:
        parsed = NoiseReductionParameters.model_validate(parameters)
        reduce_noise(input_path, output_path, strength=parsed.strength)


class PluginRegistry:
    def __init__(self, plugins: list[PythonAudioPlugin]) -> None:
        self._plugins = {plugin.id: plugin for plugin in plugins}
        if len(self._plugins) != len(plugins):
            raise ValueError("Python plugin ids must be unique")

    def manifests(self) -> list[PluginManifest]:
        return [self._plugins[plugin_id].manifest() for plugin_id in sorted(self._plugins)]

    def run(
        self,
        plugin_id: str,
        input_path: Path,
        output_path: Path,
        parameters: dict[str, Any],
    ) -> None:
        plugin = self._plugins.get(plugin_id)
        if plugin is None:
            raise AudioProcessingError(
                "plugin_not_found",
                f"Python audio plugin {plugin_id!r} is not registered",
                status_code=404,
            )
        try:
            parsed = plugin.parameters_model.model_validate(parameters)
        except ValidationError as error:
            raise AudioProcessingError(
                "invalid_plugin_parameters",
                str(error),
            ) from error
        plugin.process(input_path, output_path, parsed)


plugin_registry = PluginRegistry([NormalizePlugin(), ReverbPlugin(), NoiseReductionPlugin()])
