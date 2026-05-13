"""Testes da `voice.streaming.StreamingSession` com STT fake.

Unit-only: testa a lógica de buffer + janelas + overlap sem precisar de Whisper.
Integração com Whisper real fica em `test_stt_whisper.py`.
"""

from __future__ import annotations

import numpy as np
import pytest

from jarvstranscript.core.ports import TranscriptionFinal
from jarvstranscript.voice.streaming import StreamingSession


class ScriptedVAD:
    """VAD determinístico — devolve `True`/`False` numa sequência pré-definida."""

    def __init__(self, sequence: list[bool]) -> None:
        self._seq = list(sequence)
        self._idx = 0

    def is_speech(self, audio: np.ndarray) -> bool:
        del audio
        if self._idx >= len(self._seq):
            return False
        result = self._seq[self._idx]
        self._idx += 1
        return result


class FakeSTT:
    """STT determinístico — texto = 'call{i}/{duration:.2f}s', sem GPU."""

    def __init__(self) -> None:
        self.calls: list[np.ndarray] = []
        self._device = "cpu"

    @property
    def device(self) -> str:
        return self._device

    async def transcribe_final(self, audio: np.ndarray) -> TranscriptionFinal:
        self.calls.append(audio.copy())
        dur = audio.size / 16_000
        return TranscriptionFinal(
            text=f"call{len(self.calls)}/{dur:.2f}s",
            latency_ms=5,
            confidence=0.9,
        )


SR = 16_000


def _silence(seconds: float) -> np.ndarray:
    return np.zeros(int(seconds * SR), dtype=np.float32)


class TestStreamingSessionInit:
    def test_rejeita_partial_interval_zero_ou_negativo(self) -> None:
        with pytest.raises(ValueError, match="partial_interval_s"):
            StreamingSession(stt=FakeSTT(), partial_interval_s=0)

    def test_rejeita_overlap_negativo(self) -> None:
        with pytest.raises(ValueError, match="overlap_s nao pode"):
            StreamingSession(stt=FakeSTT(), overlap_s=-0.1)

    def test_rejeita_overlap_maior_ou_igual_ao_intervalo(self) -> None:
        with pytest.raises(ValueError, match="overlap_s precisa"):
            StreamingSession(stt=FakeSTT(), partial_interval_s=1.0, overlap_s=1.0)


class TestStreamingSessionFeed:
    async def test_buffer_menor_que_threshold_nao_emite(self) -> None:
        stt = FakeSTT()
        session = StreamingSession(stt, partial_interval_s=1.0, overlap_s=0.0)
        partials = await session.feed(_silence(0.5))
        assert partials == []
        assert stt.calls == []
        assert session.buffer_samples == 8_000

    async def test_atingir_exatamente_threshold_emite_um_partial(self) -> None:
        stt = FakeSTT()
        session = StreamingSession(stt, partial_interval_s=1.0, overlap_s=0.0)
        partials = await session.feed(_silence(1.0))
        assert len(partials) == 1
        assert partials[0].text == "call1/1.00s"
        assert partials[0].confidence == 0.9
        assert partials[0].latency_ms == 5
        assert len(stt.calls) == 1
        assert stt.calls[0].size == SR

    async def test_chunk_gigante_emite_multiplos_partials(self) -> None:
        stt = FakeSTT()
        session = StreamingSession(stt, partial_interval_s=1.0, overlap_s=0.0)
        partials = await session.feed(_silence(3.0))
        assert len(partials) == 3
        assert [p.text for p in partials] == ["call1/1.00s", "call2/1.00s", "call3/1.00s"]
        for call in stt.calls:
            assert call.size == SR

    async def test_overlap_adiciona_contexto_anterior_na_proxima_janela(self) -> None:
        stt = FakeSTT()
        session = StreamingSession(stt, partial_interval_s=1.0, overlap_s=0.2)
        # primeira janela: sem overlap (não há audio anterior)
        await session.feed(_silence(1.0))
        # segunda janela: deve incluir 0.2s de overlap antes do "novo" 1.0s
        await session.feed(_silence(1.0))
        assert len(stt.calls) == 2
        assert stt.calls[0].size == SR  # 1.0s
        assert stt.calls[1].size == int(1.2 * SR)  # 1.0s + 0.2s overlap

    async def test_chunk_em_dois_feeds_consecutivos_acumula_corretamente(self) -> None:
        stt = FakeSTT()
        session = StreamingSession(stt, partial_interval_s=1.0, overlap_s=0.0)
        # alimenta meio segundo de cada vez
        p1 = await session.feed(_silence(0.5))
        assert p1 == []
        p2 = await session.feed(_silence(0.5))
        assert len(p2) == 1
        assert p2[0].text == "call1/1.00s"

    async def test_chunk_dtype_diferente_e_convertido(self) -> None:
        stt = FakeSTT()
        session = StreamingSession(stt, partial_interval_s=1.0, overlap_s=0.0)
        chunk = np.zeros(SR, dtype=np.float64)  # f64 em vez de f32
        partials = await session.feed(chunk)
        assert len(partials) == 1
        assert stt.calls[0].dtype == np.float32

    async def test_chunk_2d_explode(self) -> None:
        session = StreamingSession(FakeSTT(), partial_interval_s=1.0)
        with pytest.raises(ValueError, match="1D"):
            await session.feed(np.zeros((2, SR), dtype=np.float32))


class TestStreamingSessionFinalize:
    async def test_buffer_vazio_devolve_final_vazio(self) -> None:
        stt = FakeSTT()
        session = StreamingSession(stt)
        final = await session.finalize()
        assert final.text == ""
        assert final.latency_ms == 0
        assert final.confidence == 0.0
        assert stt.calls == []

    async def test_finalize_transcreve_buffer_inteiro(self) -> None:
        stt = FakeSTT()
        session = StreamingSession(stt, partial_interval_s=1.0, overlap_s=0.0)
        await session.feed(_silence(0.5))
        final = await session.finalize()
        assert "0.50s" in final.text
        assert len(stt.calls) == 1  # só o finalize (feed nao emitiu partial)

    async def test_finalize_chamado_apos_partials_inclui_buffer_completo(self) -> None:
        stt = FakeSTT()
        session = StreamingSession(stt, partial_interval_s=1.0, overlap_s=0.0)
        await session.feed(_silence(2.5))  # 2 partials + 0.5s residual
        final = await session.finalize()
        # final transcreve buffer inteiro (2.5s), não só o residual
        assert "2.50s" in final.text
        # 3 chamadas: 2 partials + 1 final
        assert len(stt.calls) == 3
        assert stt.calls[-1].size == int(2.5 * SR)


class TestStreamingSessionReset:
    async def test_reset_zera_buffer_e_ponteiro(self) -> None:
        stt = FakeSTT()
        session = StreamingSession(stt, partial_interval_s=1.0, overlap_s=0.0)
        await session.feed(_silence(0.5))
        session.reset()
        assert session.buffer_samples == 0
        # próximo feed começa do zero
        partials = await session.feed(_silence(1.0))
        assert len(partials) == 1


class TestStreamingSessionAutoEnd:
    async def test_sem_vad_should_auto_end_e_sempre_false(self) -> None:
        session = StreamingSession(FakeSTT())
        await session.feed(_silence(5.0))
        assert session.should_auto_end() is False

    async def test_silence_to_end_ms_sem_vad_explode(self) -> None:
        with pytest.raises(ValueError, match="silence_to_end_ms exige vad"):
            StreamingSession(FakeSTT(), silence_to_end_ms=3000)

    async def test_silence_negativo_explode(self) -> None:
        vad = ScriptedVAD([False])
        with pytest.raises(ValueError, match="silence_to_end_ms deve"):
            StreamingSession(FakeSTT(), vad=vad, silence_to_end_ms=0)

    async def test_sem_speech_nunca_auto_end_mesmo_em_silencio(self) -> None:
        # VAD sempre devolve False → tudo é silêncio
        vad = ScriptedVAD([False] * 50)
        session = StreamingSession(FakeSTT(), vad=vad, silence_to_end_ms=1000)
        for _ in range(10):
            await session.feed(_silence(0.5))  # 5s total de silêncio
        assert session.should_auto_end() is False

    async def test_speech_seguido_de_silencio_curto_nao_auto_end(self) -> None:
        # speech 1 chunk + silêncio 0.5s (limiar 1s) → não encerra ainda
        vad = ScriptedVAD([True, False])
        session = StreamingSession(FakeSTT(), vad=vad, silence_to_end_ms=1000)
        await session.feed(_silence(0.5))  # marca speech
        await session.feed(_silence(0.5))  # 0.5s de silêncio
        assert session.should_auto_end() is False
        assert session.has_speech_started is True

    async def test_speech_seguido_de_silencio_atinge_limiar_auto_end(self) -> None:
        # speech 1 chunk + silêncio 1.5s (limiar 1s) → encerra
        vad = ScriptedVAD([True, False, False, False])
        session = StreamingSession(FakeSTT(), vad=vad, silence_to_end_ms=1000)
        await session.feed(_silence(0.5))  # speech
        await session.feed(_silence(0.5))  # 0.5s silencio acumulado
        await session.feed(_silence(0.5))  # 1.0s silencio (atinge)
        assert session.should_auto_end() is True

    async def test_speech_resetando_silencio(self) -> None:
        # speech, silêncio 0.5s, speech de novo, silêncio 0.5s → não auto end ainda
        vad = ScriptedVAD([True, False, True, False])
        session = StreamingSession(FakeSTT(), vad=vad, silence_to_end_ms=1000)
        await session.feed(_silence(0.5))  # speech
        await session.feed(_silence(0.5))  # silencio 0.5s
        assert session.silence_run_seconds == pytest.approx(0.5, abs=0.01)
        await session.feed(_silence(0.5))  # speech reseta
        assert session.silence_run_seconds == 0
        await session.feed(_silence(0.5))  # silencio 0.5s
        assert session.should_auto_end() is False

    async def test_reset_limpa_estado_vad(self) -> None:
        vad = ScriptedVAD([True, False, False])
        session = StreamingSession(FakeSTT(), vad=vad, silence_to_end_ms=1000)
        await session.feed(_silence(0.5))  # speech
        await session.feed(_silence(1.5))  # silencio longo
        assert session.should_auto_end() is True
        session.reset()
        assert session.should_auto_end() is False
        assert session.has_speech_started is False
        assert session.silence_run_seconds == 0
