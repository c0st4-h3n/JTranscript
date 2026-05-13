"""Testes do `ConfigManager` — orquestra disco + STTContainer reload."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from jarvstranscript.adapters.stt_container import STTContainer
from jarvstranscript.core.ports import TranscriptionFinal
from jarvstranscript.settings.config import Settings, load_settings
from jarvstranscript.settings.manager import ConfigManager


class FakeSTT:
    def __init__(self, model: str, device: str) -> None:
        self.model = model
        self._device = device
        self.closed = False

    @property
    def device(self) -> str:
        return self._device

    async def transcribe_final(self, audio: np.ndarray) -> TranscriptionFinal:
        return TranscriptionFinal(text=f"{self.model}", latency_ms=1, confidence=1.0)

    def close(self) -> None:
        self.closed = True


def _factory():
    def make(model: str, device: str) -> FakeSTT:
        return FakeSTT(model, device)
    return make


def _make_manager(tmp_path: Path) -> ConfigManager:
    cfg_path = tmp_path / "config.json"
    settings = Settings.defaults()
    stt = STTContainer(_factory(), settings.model, settings.device)
    return ConfigManager(settings, stt, cfg_path)


class TestConfigManagerApply:
    async def test_apply_persiste_settings_no_disco(self, tmp_path: Path) -> None:
        cfg_path = tmp_path / "config.json"
        cm = _make_manager(tmp_path)
        # Sobrescreve o path interno pro teste apontar pro tmp
        cm._path = cfg_path

        result = await cm.apply({"model": "large-v3-turbo"})

        assert result["settings"]["model"] == "large-v3-turbo"
        # Disco reflete
        from_disk = load_settings(cfg_path)
        assert from_disk.model == "large-v3-turbo"

    async def test_apply_dispara_reload_quando_model_muda(self, tmp_path: Path) -> None:
        cm = _make_manager(tmp_path)
        cm._path = tmp_path / "config.json"

        result = await cm.apply({"model": "medium"})

        assert result["reload"] is not None
        assert result["reload"]["changed"] is True
        assert result["reload"]["model"] == "medium"
        assert cm.stt_container.current_model == "medium"

    async def test_apply_nao_dispara_reload_quando_so_muda_campo_nao_hot(
        self, tmp_path: Path
    ) -> None:
        cm = _make_manager(tmp_path)
        cm._path = tmp_path / "config.json"

        result = await cm.apply({"mode": "toggle"})

        assert result["reload"] is None
        assert cm.settings.mode == "toggle"
        # Modelo continua o mesmo
        assert cm.stt_container.current_model == "tiny"

    async def test_apply_filtra_chaves_desconhecidas(self, tmp_path: Path) -> None:
        cm = _make_manager(tmp_path)
        cm._path = tmp_path / "config.json"

        result = await cm.apply({"model": "small", "campo_inexistente": "x"})

        assert result["settings"]["model"] == "small"
        assert "campo_inexistente" not in result["settings"]

    async def test_apply_patch_nao_dict_explode(self, tmp_path: Path) -> None:
        cm = _make_manager(tmp_path)
        with pytest.raises(ValueError, match="dict"):
            await cm.apply("nao e dict")  # type: ignore[arg-type]

    async def test_settings_property_reflete_estado_atual(self, tmp_path: Path) -> None:
        cm = _make_manager(tmp_path)
        cm._path = tmp_path / "config.json"
        assert cm.settings.model == "tiny"
        await cm.apply({"model": "small"})
        assert cm.settings.model == "small"
