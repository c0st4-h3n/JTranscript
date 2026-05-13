"""Integração Whisper — Fase 1.

Pipeline real: fixture audio (edge-tts) -> load_audio_file -> WhisperAdapter (GPU, tiny) -> texto.

Tests pesados (downloadam modelo na primeira execução). Marcados `@gpu` + `@slow`.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from jarvstranscript.adapters.stt_whisper import WhisperAdapter
from jarvstranscript.voice.audio_codec import load_audio_file
from jarvstranscript.voice.streaming import StreamingSession


@pytest.mark.gpu
@pytest.mark.slow
async def test_whisper_tiny_transcreve_audio_real(
    audio_fixture_path: Path,
    fixture_expected_words: list[str],
) -> None:
    """Critério da Fase 1: GPU confirmada + texto não-vazio batendo no esperado."""
    adapter = WhisperAdapter(model_name="tiny", device="cuda", language="pt")
    try:
        assert adapter.device == "cuda", f"esperava cuda, peguei {adapter.device!r}"

        audio = load_audio_file(audio_fixture_path)
        result = await adapter.transcribe_final(audio)

        assert result.text.strip(), "texto transcrito veio vazio"
        assert result.latency_ms > 0, "latencia zerada — algo nao mediu"

        text_lower = result.text.lower()
        hit = next((w for w in fixture_expected_words if w in text_lower), None)
        assert hit is not None, (
            f"nenhuma palavra-chave bateu no texto transcrito: {result.text!r}\n"
            f"esperava ao menos uma de: {fixture_expected_words}"
        )
    finally:
        adapter.close()


async def test_whisper_buffer_vazio_devolve_texto_vazio(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Edge case: chamar com array vazio nao deve sequer invocar o modelo.

    Usa monkeypatch pra nao precisar carregar Whisper de verdade — testamos
    apenas o guard inicial.
    """
    import numpy as np

    # Stub do WhisperModel pra construtor passar sem baixar modelo
    class FakeModel:
        def transcribe(self, *args: object, **kwargs: object) -> tuple[list[object], object]:
            raise AssertionError("nao deveria ser chamado com buffer vazio")

    import faster_whisper

    def fake_init(self: object, *args: object, **kwargs: object) -> None:
        return None

    monkeypatch.setattr(faster_whisper.WhisperModel, "__init__", fake_init)
    monkeypatch.setattr(faster_whisper.WhisperModel, "transcribe", FakeModel.transcribe)

    adapter = WhisperAdapter(model_name="tiny", device="cpu", language="pt")
    result = await adapter.transcribe_final(np.zeros(0, dtype=np.float32))
    assert result.text == ""
    assert result.latency_ms == 0


def test_resolve_device_rejeita_valor_invalido() -> None:
    from jarvstranscript.adapters.stt_whisper import _resolve_device

    with pytest.raises(ValueError, match="device invalido"):
        _resolve_device("tpu")


def test_resolve_device_cuda_explicito_passa_direto() -> None:
    from jarvstranscript.adapters.stt_whisper import _resolve_device

    assert _resolve_device("cuda") == "cuda"
    assert _resolve_device("cpu") == "cpu"


@pytest.mark.gpu
@pytest.mark.slow
async def test_streaming_session_com_whisper_real(
    audio_fixture_path: Path,
    fixture_expected_words: list[str],
) -> None:
    """Simula o fluxo do frontend: chunks de 200ms -> partials progressivos + final."""
    import numpy as np

    adapter = WhisperAdapter(model_name="tiny", device="cuda", language="pt")
    try:
        audio = load_audio_file(audio_fixture_path)  # ~3.8s @ 16kHz
        chunk_size = int(0.2 * 16_000)  # 200ms

        session = StreamingSession(
            adapter, partial_interval_s=1.0, overlap_s=0.2
        )

        all_partials = []
        for start in range(0, audio.size, chunk_size):
            chunk = audio[start : start + chunk_size].astype(np.float32, copy=False)
            partials = await session.feed(chunk)
            all_partials.extend(partials)

        final = await session.finalize()

        # ~3.8s / 1.0s partial_interval = ao menos 2 partials
        assert len(all_partials) >= 2, (
            f"esperava 2+ partials em ~3.8s, recebi {len(all_partials)}: "
            f"{[p.text for p in all_partials]}"
        )

        # cada partial tem texto e latencia medidos
        for i, p in enumerate(all_partials):
            assert p.latency_ms > 0, f"partial {i} sem latencia"
            assert 0.0 <= p.confidence <= 1.0, f"partial {i} confidence fora de range"

        # final tem o texto completo
        assert final.text.strip(), "final veio vazio"
        text_lower = final.text.lower()
        hit = next((w for w in fixture_expected_words if w in text_lower), None)
        assert hit is not None, f"final nao tem palavra esperada: {final.text!r}"
        assert 0.0 <= final.confidence <= 1.0
    finally:
        adapter.close()
