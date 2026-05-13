"""WebSocket server localhost:7979 — IPC com o frontend Tauri.

Recebe um `ConfigManager` (que dono do STTContainer + Settings) e despacha
o protocolo via `SessionHandler` por conexão. `set_config`/`get_config`
permitem hot-reload de model/device sem reiniciar o backend.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

import websockets
from websockets.asyncio.server import ServerConnection, serve

from jarvstranscript import PROTOCOL_VERSION
from jarvstranscript.core.ports import VADPort
from jarvstranscript.ipc import log_stream
from jarvstranscript.ipc.session_handler import SessionHandler
from jarvstranscript.settings.manager import ConfigManager


class WSServer:
    """Servidor WebSocket assíncrono."""

    def __init__(
        self,
        config: ConfigManager,
        *,
        vad: VADPort | None = None,
        host: str = "127.0.0.1",
        port: int = 7979,
    ) -> None:
        self._config = config
        self._vad = vad
        self._host = host
        self._requested_port = port
        self._server: websockets.asyncio.server.Server | None = None

    @property
    def port(self) -> int:
        if self._server is None:
            raise RuntimeError("server nao iniciado — chame start() antes")
        sockets = self._server.sockets
        if not sockets:
            raise RuntimeError("server sem sockets — start() falhou silenciosamente")
        return sockets[0].getsockname()[1]

    async def start(self) -> None:
        self._server = await serve(self._handle, self._host, self._requested_port)
        log_stream.emit(
            "ws.listen",
            "ws escutando",
            host=self._host,
            port=self.port,
            protocol_version=PROTOCOL_VERSION,
            model=self._config.settings.model,
            device=self._config.stt_container.device,
        )

    async def stop(self) -> None:
        if self._server is None:
            return
        self._server.close()
        await self._server.wait_closed()
        self._server = None
        log_stream.emit("ws.stop", "ws encerrado")

    async def serve_forever(self) -> None:
        if self._server is None:
            await self.start()
        assert self._server is not None
        await self._server.serve_forever()

    async def _handle(self, ws: ServerConnection) -> None:
        send: callable = lambda payload: self._send(ws, payload)  # noqa: E731
        handler = SessionHandler(stt=self._config.stt_container, send=send, vad=self._vad)

        await self._send(
            ws,
            {
                "type": "ready",
                "model": self._config.settings.model,
                "gpu": self._config.stt_container.device == "cuda",
                "protocol_version": PROTOCOL_VERSION,
            },
        )
        try:
            async for raw in ws:
                await self._dispatch(handler, ws, raw)
        except websockets.ConnectionClosed:
            return

    async def _dispatch(
        self,
        handler: SessionHandler,
        ws: ServerConnection,
        raw: str | bytes,
    ) -> None:
        try:
            msg = json.loads(raw)
        except json.JSONDecodeError:
            await self._send(
                ws,
                {"type": "error", "code": "invalid_json", "message": "payload nao e json valido"},
            )
            return

        msg_type = msg.get("type")
        if msg_type == "ping":
            await self._send(ws, {"type": "pong"})
            return
        if msg_type == "session_start":
            await handler.on_session_start(msg)
            return
        if msg_type == "audio_chunk":
            await handler.on_audio_chunk(msg)
            return
        if msg_type == "session_end":
            await handler.on_session_end()
            return
        if msg_type == "cancel":
            await handler.on_cancel()
            return
        if msg_type == "get_config":
            await self._send(ws, {"type": "config", "settings": self._config.settings.to_dict()})
            return
        if msg_type == "set_config":
            await self._handle_set_config(ws, msg)
            return
        await self._send(
            ws,
            {
                "type": "error",
                "code": "unknown_type",
                "message": f"tipo desconhecido: {msg_type!r}",
            },
        )

    async def _handle_set_config(self, ws: ServerConnection, msg: dict[str, Any]) -> None:
        patch = msg.get("config", {})
        try:
            result = await self._config.apply(patch)
        except ValueError as e:
            await self._send(
                ws,
                {"type": "error", "code": "config_invalid", "message": str(e)},
            )
            return
        log_stream.emit(
            "config.apply",
            "config aplicado",
            model=result["settings"]["model"],
            reload=result["reload"] is not None,
            reload_changed=result["reload"]["changed"] if result["reload"] else False,
        )
        await self._send(ws, {"type": "config_applied", **result})

    async def _send(self, ws: ServerConnection, payload: dict[str, Any]) -> None:
        await ws.send(json.dumps(payload))


async def run(
    config: ConfigManager,
    *,
    vad: VADPort | None = None,
    host: str = "127.0.0.1",
    port: int = 7979,
) -> None:
    server = WSServer(config=config, vad=vad, host=host, port=port)
    await server.start()
    try:
        await server.serve_forever()
    except asyncio.CancelledError:
        pass
    finally:
        await server.stop()
