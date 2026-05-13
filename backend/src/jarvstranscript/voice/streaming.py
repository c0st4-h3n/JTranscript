"""Sliding-window streaming — orquestra buffer + janelas sobre um STTPort.

`StreamingSession` acumula chunks PCM float32 conforme chegam (do WS) e emite
`TranscriptionPartial` a cada `partial_interval_s` segundos de áudio novo. Cada
janela inclui `overlap_s` segundos da janela anterior pra Whisper ter contexto
e não cortar palavras no meio.

`finalize()` roda um pass final no buffer inteiro — é onde sai a transcrição
canônica (que pode entrar no polish do Qwen na Fase 8).

Modo toggle (Fase 7): aceita um `VADPort` + `silence_to_end_ms`. Após o usuário
ter falado ao menos um chunk com voz, acumula silêncio; quando passa do limiar,
`should_auto_end()` vira `True` e o caller (`SessionHandler`) deve `finalize()`.

Design intencional: streaming logic NÃO vive no adapter. Trocar Whisper por
qualquer outro `STTPort` (Vosk, faster-distil-whisper) reusa essa classe sem
alteração.

Modelo de partials: **incremental** — cada partial cobre só a porção nova de
áudio. Frontend acumula partials pra mostrar texto progressivo na pill. O
`final` substitui a versão concatenada de partials por uma transcrição
holística (corrige drift entre janelas).
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from jarvstranscript.core.ports import (
    STTPort,
    TranscriptionFinal,
    TranscriptionPartial,
    VADPort,
)

DEFAULT_SAMPLE_RATE = 16_000
DEFAULT_PARTIAL_INTERVAL_S = 1.5
DEFAULT_OVERLAP_S = 0.2


class StreamingSession:
    """Sessão de streaming. Stateful — não compartilhar entre conexões.

    Uso típico:
        session = StreamingSession(stt=whisper_adapter)
        async for chunk in ws_audio_chunks:
            for partial in await session.feed(chunk):
                await ws.send_partial(partial)
        final = await session.finalize()
        await ws.send_final(final)

    Modo toggle com auto-end:
        session = StreamingSession(stt=stt, vad=silero, silence_to_end_ms=3000)
        async for chunk in ws_audio_chunks:
            for partial in await session.feed(chunk):
                await ws.send_partial(partial)
            if session.should_auto_end():
                final = await session.finalize()
                ...
                break
    """

    def __init__(
        self,
        stt: STTPort,
        *,
        vad: VADPort | None = None,
        silence_to_end_ms: int | None = None,
        sample_rate: int = DEFAULT_SAMPLE_RATE,
        partial_interval_s: float = DEFAULT_PARTIAL_INTERVAL_S,
        overlap_s: float = DEFAULT_OVERLAP_S,
    ) -> None:
        if partial_interval_s <= 0:
            raise ValueError("partial_interval_s deve ser > 0")
        if overlap_s < 0:
            raise ValueError("overlap_s nao pode ser negativo")
        if overlap_s >= partial_interval_s:
            raise ValueError("overlap_s precisa ser menor que partial_interval_s")
        if silence_to_end_ms is not None and silence_to_end_ms <= 0:
            raise ValueError("silence_to_end_ms deve ser > 0")
        if silence_to_end_ms is not None and vad is None:
            raise ValueError("silence_to_end_ms exige vad")

        self._stt = stt
        self._vad = vad
        self._sample_rate = sample_rate
        self._partial_samples = int(partial_interval_s * sample_rate)
        self._overlap_samples = int(overlap_s * sample_rate)
        self._silence_to_end_samples = (
            int(silence_to_end_ms / 1000 * sample_rate) if silence_to_end_ms else None
        )
        self._buffer: NDArray[np.float32] = np.zeros(0, dtype=np.float32)
        self._next_window_start_samples = 0
        self._silence_run_samples = 0
        self._has_speech_started = False

    @property
    def buffer_seconds(self) -> float:
        return self._buffer.size / self._sample_rate

    @property
    def buffer_samples(self) -> int:
        return int(self._buffer.size)

    @property
    def silence_run_seconds(self) -> float:
        return self._silence_run_samples / self._sample_rate

    @property
    def has_speech_started(self) -> bool:
        return self._has_speech_started

    async def feed(self, chunk: NDArray[np.float32]) -> list[TranscriptionPartial]:
        """Adiciona chunk ao buffer. Retorna lista de partials emitidos.

        Lista vazia se o buffer ainda não atingiu `partial_interval_s` desde o
        último partial. Pode ter mais de 1 elemento se `chunk` for grande o
        bastante pra cruzar múltiplos thresholds.

        Side effect: se VAD configurado, atualiza tracking de silêncio.
        """
        if chunk.dtype != np.float32:
            chunk = chunk.astype(np.float32, copy=False)
        if chunk.ndim != 1:
            raise ValueError(f"chunk deve ser 1D, recebi shape {chunk.shape}")

        # VAD tracking — antes de mexer no buffer, decide se este chunk tem voz.
        if self._vad is not None:
            if self._vad.is_speech(chunk):
                self._has_speech_started = True
                self._silence_run_samples = 0
            elif self._has_speech_started:
                # só conta silêncio depois que falou pelo menos uma vez
                self._silence_run_samples += chunk.size

        self._buffer = (
            chunk.copy() if self._buffer.size == 0 else np.concatenate([self._buffer, chunk])
        )

        partials: list[TranscriptionPartial] = []
        while (self._buffer.size - self._next_window_start_samples) >= self._partial_samples:
            window_start = max(0, self._next_window_start_samples - self._overlap_samples)
            window_end = self._next_window_start_samples + self._partial_samples
            window = self._buffer[window_start:window_end]
            result = await self._stt.transcribe_final(window)
            partials.append(
                TranscriptionPartial(
                    text=result.text,
                    confidence=result.confidence,
                    latency_ms=result.latency_ms,
                )
            )
            self._next_window_start_samples += self._partial_samples
        return partials

    def should_auto_end(self) -> bool:
        """`True` se VAD configurado, usuário falou, e silêncio passou do limiar."""
        if self._silence_to_end_samples is None:
            return False
        if not self._has_speech_started:
            return False
        return self._silence_run_samples >= self._silence_to_end_samples

    async def finalize(self) -> TranscriptionFinal:
        """Roda pass final sobre o buffer inteiro. Idempotente."""
        if self._buffer.size == 0:
            return TranscriptionFinal(text="", latency_ms=0, confidence=0.0)
        return await self._stt.transcribe_final(self._buffer)

    def reset(self) -> None:
        """Zera o buffer e estado de VAD (entre sessões na mesma instância)."""
        self._buffer = np.zeros(0, dtype=np.float32)
        self._next_window_start_samples = 0
        self._silence_run_samples = 0
        self._has_speech_started = False
