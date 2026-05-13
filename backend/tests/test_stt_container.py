"""Testes do `STTContainer` — wrapper hot-reloadable com factory injetável."""

from __future__ import annotations

from typing import Any

import numpy as np
import pytest

from jarvstranscript.adapters.stt_container import ReloadResult, STTContainer
from jarvstranscript.core.ports import TranscriptionFinal


class FakeSTT:
    """STT fake — devolve texto previsível e marca closed quando fechado."""

    def __init__(self, model: str, device: str) -> None:
        self.model = model
        self._device = device
        self.closed = False
        self.calls: list[np.ndarray] = []

    @property
    def device(self) -> str:
        return self._device

    async def transcribe_final(self, audio: np.ndarray) -> TranscriptionFinal:
        self.calls.append(audio.copy())
        return TranscriptionFinal(
            text=f"fake/{self.model}/{self._device}",
            latency_ms=1,
            confidence=0.9,
        )

    def close(self) -> None:
        self.closed = True


def _factory(records: list[FakeSTT] | None = None, fail_on: str | None = None) -> Any:
    """Factory de teste — opcionalmente registra adapters criados e/ou falha
    quando model_name == fail_on."""

    def make(model: str, device: str) -> FakeSTT:
        if fail_on is not None and model == fail_on:
            raise RuntimeError(f"factory falhou pra {model}")
        a = FakeSTT(model, device)
        if records is not None:
            records.append(a)
        return a

    return make


class TestSTTContainerBasics:
    async def test_construtor_inicializa_adapter_atual(self) -> None:
        records: list[FakeSTT] = []
        cont = STTContainer(_factory(records), "tiny", "cuda")
        assert cont.current_model == "tiny"
        assert cont.device == "cuda"
        assert len(records) == 1
        assert records[0].model == "tiny"

    async def test_transcribe_final_delega_pro_adapter_atual(self) -> None:
        cont = STTContainer(_factory(), "tiny", "cpu")
        audio = np.zeros(100, dtype=np.float32)
        result = await cont.transcribe_final(audio)
        assert result.text == "fake/tiny/cpu"


class TestSTTContainerReload:
    async def test_reload_para_modelo_diferente_troca_adapter(self) -> None:
        records: list[FakeSTT] = []
        cont = STTContainer(_factory(records), "tiny", "cuda")

        result = await cont.reload("large-v3-turbo", "cuda")

        assert result == ReloadResult(changed=True, model="large-v3-turbo", device="cuda")
        assert cont.current_model == "large-v3-turbo"
        assert len(records) == 2
        # o velho foi fechado
        assert records[0].closed is True
        assert records[1].closed is False

    async def test_reload_para_mesmo_modelo_e_device_e_no_op(self) -> None:
        records: list[FakeSTT] = []
        cont = STTContainer(_factory(records), "tiny", "cuda")
        result = await cont.reload("tiny", "cuda")
        assert result.changed is False
        assert result.model == "tiny"
        assert len(records) == 1, "factory nao deveria ter sido chamada"

    async def test_reload_factory_falha_mantem_adapter_atual(self) -> None:
        records: list[FakeSTT] = []
        factory = _factory(records, fail_on="modelo-quebrado")
        cont = STTContainer(factory, "tiny", "cuda")

        result = await cont.reload("modelo-quebrado", "cuda")

        assert result.changed is False
        assert result.error is not None
        assert "quebrado" in result.error
        assert cont.current_model == "tiny"
        # adapter original continua vivo
        assert records[0].closed is False

    async def test_proxima_transcribe_apos_reload_usa_novo_adapter(self) -> None:
        cont = STTContainer(_factory(), "tiny", "cpu")
        await cont.reload("large-v3-turbo", "cpu")
        audio = np.zeros(50, dtype=np.float32)
        r = await cont.transcribe_final(audio)
        assert r.text == "fake/large-v3-turbo/cpu"

    async def test_close_fecha_adapter_atual(self) -> None:
        records: list[FakeSTT] = []
        cont = STTContainer(_factory(records), "tiny", "cuda")
        cont.close()
        assert records[0].closed is True

    async def test_on_reload_success_e_chamado_apos_swap(self) -> None:
        calls: list[str] = []
        cont = STTContainer(
            _factory(),
            "tiny",
            "cuda",
            on_reload_success=calls.append,
        )
        await cont.reload("medium", "cuda")
        assert calls == ["medium"]

    async def test_on_reload_success_nao_e_chamado_quando_noop(self) -> None:
        calls: list[str] = []
        cont = STTContainer(
            _factory(),
            "tiny",
            "cuda",
            on_reload_success=calls.append,
        )
        await cont.reload("tiny", "cuda")  # mesmo modelo, no-op
        assert calls == []

    async def test_on_reload_success_nao_e_chamado_quando_factory_falha(self) -> None:
        calls: list[str] = []
        factory = _factory(fail_on="quebrado")
        cont = STTContainer(factory, "tiny", "cuda", on_reload_success=calls.append)
        await cont.reload("quebrado", "cuda")
        assert calls == []

    async def test_on_reload_success_callback_explodindo_nao_quebra_reload(self) -> None:
        def boom(_: str) -> None:
            raise RuntimeError("callback explodiu")

        cont = STTContainer(_factory(), "tiny", "cuda", on_reload_success=boom)
        result = await cont.reload("medium", "cuda")
        # Reload em si foi um sucesso — callback falhou silenciosamente
        assert result.changed is True
        assert result.model == "medium"
        assert cont.current_model == "medium"


class TestSTTContainerLocking:
    async def test_transcribe_e_reload_serializam_no_lock(self) -> None:
        """Reload bloqueia até transcribe pendente terminar — e vice-versa.

        Não tentamos forçar uma race real; verificamos que após uma sequência
        de transcribe → reload → transcribe, os resultados são consistentes
        com a ordem.
        """
        cont = STTContainer(_factory(), "tiny", "cpu")
        audio = np.zeros(10, dtype=np.float32)

        r1 = await cont.transcribe_final(audio)
        assert "tiny" in r1.text

        await cont.reload("medium", "cpu")

        r2 = await cont.transcribe_final(audio)
        assert "medium" in r2.text
