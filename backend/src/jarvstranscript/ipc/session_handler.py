"""Orquestrador per-conexão WS.

Cada conexão WebSocket tem um `SessionHandler` próprio. Ele:
- Mantém o estado da sessão atual (`StreamingSession` ou `None`).
- Despacha `session_start`/`audio_chunk`/`session_end`/`cancel` pra `StreamingSession`.
- Empurra `partial`/`final`/`error` de volta pelo `send()` injetado.
- No modo toggle, monitora VAD após cada chunk; encerra sessão sozinho quando
  o silêncio passa do limiar (3s default — Fase 7).
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

from jarvstranscript.core.ports import STTPort, VADPort
from jarvstranscript.ipc import log_stream
from jarvstranscript.voice.audio_codec import decode_pcm_f32_b64
from jarvstranscript.voice.streaming import StreamingSession

# Tipo do callback que envia mensagens de volta pro cliente.
SendFn = Callable[[dict[str, Any]], Awaitable[None]]

# Tempo de silêncio que encerra sessão automaticamente no modo toggle.
TOGGLE_SILENCE_TO_END_MS = 3000


class SessionHandler:
    """Estado por conexão WS. Não thread-safe — uma instância por conexão."""

    def __init__(self, stt: STTPort, send: SendFn, vad: VADPort | None = None) -> None:
        self._stt = stt
        self._send = send
        self._vad = vad
        self._session: StreamingSession | None = None
        self._current_mode: str = "ptt"

    @property
    def has_active_session(self) -> bool:
        return self._session is not None

    async def on_session_start(self, payload: dict[str, Any]) -> None:
        mode = str(payload.get("mode", "ptt"))
        self._current_mode = mode

        # Auto-end via VAD só faz sentido no modo toggle (PTT termina via on_release).
        use_vad = mode == "toggle" and self._vad is not None
        self._session = StreamingSession(
            stt=self._stt,
            vad=self._vad if use_vad else None,
            silence_to_end_ms=TOGGLE_SILENCE_TO_END_MS if use_vad else None,
        )
        log_stream.emit(
            "session.start",
            "sessao iniciada",
            mode=mode,
            polish=payload.get("polish"),
            lang=payload.get("lang"),
            vad=use_vad,
        )

    async def on_audio_chunk(self, payload: dict[str, Any]) -> None:
        if self._session is None:
            await self._error("session_not_started", "audio_chunk antes de session_start")
            return
        data = payload.get("data", "")
        if not isinstance(data, str):
            await self._error("invalid_payload", "data precisa ser string base64")
            return
        try:
            chunk = decode_pcm_f32_b64(data)
        except ValueError as e:
            await self._error("audio_decode_failed", str(e))
            return

        partials = await self._session.feed(chunk)
        seq = payload.get("seq")
        for p in partials:
            await self._send(
                {
                    "type": "partial",
                    "text": p.text,
                    "confidence": round(p.confidence, 3),
                    "latency_ms": p.latency_ms,
                    "seq": seq,
                }
            )

        # Modo toggle: VAD pode pedir pra encerrar
        if self._session.should_auto_end():
            await self._auto_finalize()

    async def on_session_end(self) -> None:
        if self._session is None:
            await self._error("session_not_started", "session_end antes de session_start")
            return
        await self._finalize_and_emit(auto_ended=False, reason="manual")

    async def on_cancel(self) -> None:
        if self._session is None:
            return
        self._session = None
        log_stream.emit("session.end", "sessao cancelada", reason="cancel")

    async def _auto_finalize(self) -> None:
        """Disparado pelo VAD quando silêncio passou do limiar (modo toggle)."""
        await self._finalize_and_emit(auto_ended=True, reason="vad")

    async def _finalize_and_emit(self, *, auto_ended: bool, reason: str) -> None:
        assert self._session is not None
        final = await self._session.finalize()
        await self._send(
            {
                "type": "final",
                "text_raw": final.text,
                "text_polished": None,
                "polish_applied": False,
                "latency_ms": final.latency_ms,
                "auto_ended": auto_ended,
            }
        )
        log_stream.emit(
            "session.end",
            "sessao finalizada",
            reason=reason,
            text_len=len(final.text),
            confidence=round(final.confidence, 3),
            mode=self._current_mode,
        )
        self._session = None

    async def _error(self, code: str, message: str) -> None:
        await self._send({"type": "error", "code": code, "message": message})
