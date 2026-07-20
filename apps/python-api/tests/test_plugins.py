from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from app.core.errors import AudioProcessingError
from app.plugins.registry import plugin_registry
from tests.conftest import AudioFactory


def test_registry_exposes_versioned_manifests() -> None:
    manifests = plugin_registry.manifests()

    assert [manifest.id for manifest in manifests] == sorted(manifest.id for manifest in manifests)
    assert all(manifest.version == "1.0.0" for manifest in manifests)
    assert all(manifest.parameter_schema for manifest in manifests)


def test_registry_runs_normalization_plugin(
    tmp_path: Path,
    audio_factory: AudioFactory,
) -> None:
    source = audio_factory(
        tmp_path / "source.wav",
        np.linspace(-0.1, 0.1, 8_000, dtype=np.float32),
        8_000,
    )
    output = tmp_path / "output.wav"

    plugin_registry.run(
        "audio.normalize-peak",
        source,
        output,
        {"target_peak_dbfs": -2},
    )

    assert output.exists()


def test_registry_rejects_unknown_plugin(tmp_path: Path) -> None:
    with pytest.raises(AudioProcessingError, match="is not registered"):
        plugin_registry.run("unknown", tmp_path / "in.wav", tmp_path / "out.wav", {})
