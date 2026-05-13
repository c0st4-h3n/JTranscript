"""Adapter STT via faster-whisper.

Implementa só `STTPort.transcribe_final` (engine wrapping puro). Sliding-window
streaming vive em `voice.streaming.StreamingSession`, que consome este adapter.

Confidence é derivada da média de `exp(avg_logprob)` dos segments retornados pelo
faster-whisper — heurística pragmática, não probabilidade calibrada.
"""

from __future__ import annotations

import asyncio
import math
import time
from typing import TYPE_CHECKING

from jarvstranscript.core.ports import AudioBuffer, TranscriptionFinal
from jarvstranscript.ipc import log_stream
from jarvstranscript.net.gpu_bootstrap import ensure_cuda_runtime_dlls

if TYPE_CHECKING:
    from faster_whisper import WhisperModel


DEFAULT_MODEL = "large-v3-turbo"
DEFAULT_LANGUAGE = "pt"


class WhisperAdapter:
    """Implementa `STTPort` em cima de faster-whisper (CTranslate2 backend).

    Parâmetros
    ----------
    model_name: nome do checkpoint Whisper (ex.: 'large-v3-turbo', 'tiny').
    device: 'cuda', 'cpu' ou 'auto' — 'auto' tenta GPU primeiro.
    compute_type: 'float16' pra GPU, 'int8' pra CPU (defaults sensatos por device).
    language: ISO-639-1. MVP fixo em 'pt'.
    """

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL,
        device: str = "auto",
        compute_type: str | None = None,
        language: str = DEFAULT_LANGUAGE,
        beam_size: int = 5,
    ) -> None:
        ensure_cuda_runtime_dlls()
        from faster_whisper import WhisperModel as _WhisperModel

        resolved_device = _resolve_device(device)
        resolved_compute = compute_type or _default_compute(resolved_device)
        self._language = language
        self._beam_size = beam_size
        self._device = resolved_device

        load_start = time.monotonic()
        self._model: WhisperModel | None = _WhisperModel(
            model_name,
            device=resolved_device,
            compute_type=resolved_compute,
        )
        load_ms = int((time.monotonic() - load_start) * 1000)
        log_stream.emit(
            "stt.load",
            "whisper carregado",
            model=model_name,
            device=resolved_device,
            compute_type=resolved_compute,
            load_ms=load_ms,
        )

    @property
    def device(self) -> str:
        return self._device

    async def transcribe_final(self, audio: AudioBuffer) -> TranscriptionFinal:
        if self._model is None:
            raise RuntimeError("adapter ja foi fechado")
        if audio.size == 0:
            return TranscriptionFinal(text="", latency_ms=0, confidence=0.0)
        start = time.monotonic()
        text, confidence = await asyncio.to_thread(self._transcribe_sync, audio)
        latency_ms = int((time.monotonic() - start) * 1000)
        log_stream.emit(
            "stt.final",
            "transcricao final",
            text_len=len(text),
            confidence=round(confidence, 3),
            latency_ms=latency_ms,
        )
        return TranscriptionFinal(text=text, latency_ms=latency_ms, confidence=confidence)

    def close(self) -> None:
        """Libera o modelo (libera VRAM em GPU)."""
        self._model = None

    # --- internos -------------------------------------------------------

    def _transcribe_sync(self, audio: AudioBuffer) -> tuple[str, float]:
        assert self._model is not None
        segments_iter, _info = self._model.transcribe(
            audio,
            language=self._language,
            beam_size=self._beam_size,
            vad_filter=False,  # VAD próprio entra na Fase 7 via silero
        )
        segments = list(segments_iter)
        text = " ".join(seg.text.strip() for seg in segments).strip()
        confidence = _avg_confidence(segments)
        return text, confidence


def _avg_confidence(segments: list) -> float:
    """Média de `exp(avg_logprob)` clampada em [0, 1]. Heurística, não probabilidade."""
    if not segments:
        return 0.0
    probs = [math.exp(max(-10.0, getattr(s, "avg_logprob", -1.0))) for s in segments]
    avg = sum(probs) / len(probs)
    return max(0.0, min(1.0, avg))


def _resolve_device(requested: str) -> str:
    if requested == "cuda":
        return "cuda"
    if requested == "cpu":
        return "cpu"
    if requested != "auto":
        raise ValueError(f"device invalido: {requested!r} (use cuda|cpu|auto)")
    try:
        import ctranslate2

        if ctranslate2.get_cuda_device_count() > 0:
            return "cuda"
    except Exception:  # noqa: BLE001 — falha silenciosa volta pra cpu
        pass
    return "cpu"


def _default_compute(device: str) -> str:
    return "float16" if device == "cuda" else "int8"
