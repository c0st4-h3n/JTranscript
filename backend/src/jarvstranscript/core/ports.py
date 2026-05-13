"""Portas da Clean Architecture — interfaces puras sem dependências externas pesadas.

Adapters concretos (Whisper, Qwen, etc.) implementam essas portas em `adapters/`.
O core só conversa com essas interfaces; trocar STT engine não toca regra de negócio.

`STTPort` é estritamente engine wrapping (transcrição one-shot). Lógica de streaming
sliding-window vive em `voice/streaming.py`, que consome um `STTPort` injetado —
trocar Whisper por Vosk amanhã não toca a lógica de streaming.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Protocol

if TYPE_CHECKING:
    import numpy as np
    from numpy.typing import NDArray

    AudioBuffer = NDArray[np.float32]
else:
    AudioBuffer = object  # type: ignore[assignment]


@dataclass(frozen=True, slots=True)
class TranscriptionPartial:
    text: str
    confidence: float
    latency_ms: int


@dataclass(frozen=True, slots=True)
class TranscriptionFinal:
    text: str
    latency_ms: int
    confidence: float = 1.0


class STTPort(Protocol):
    """Engine de speech-to-text — transcrição one-shot de um buffer.

    Audio é sempre PCM float32 mono @ 16kHz (`numpy.ndarray`). Decode de
    bytes/base64/MP3 fica em `voice.audio_codec`. Streaming sliding-window
    em `voice.streaming.StreamingSession` — não na port.
    """

    @property
    def device(self) -> str:
        """`"cuda"` ou `"cpu"`. Permite teste/log confirmar GPU em uso."""
        ...

    async def transcribe_final(self, audio: AudioBuffer) -> TranscriptionFinal: ...


class PolishPort(Protocol):
    """Refinamento PT-BR pós-STT. Adapter padrão: Qwen 2.5 via Ollama."""

    @property
    def available(self) -> bool: ...

    async def polish(self, text: str, lang: str = "pt") -> str: ...


class VADPort(Protocol):
    """Detector de voz/silêncio. Adapter padrão: silero-vad ONNX.

    Recebe um buffer e responde se contém fala. Implementações podem ter
    estado interno (silero rastreia probabilidade), mas a interface é stateless.
    """

    def is_speech(self, audio: AudioBuffer) -> bool: ...
