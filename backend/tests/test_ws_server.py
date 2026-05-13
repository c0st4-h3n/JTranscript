"""WS server end-to-end com STT fake — exercita o protocolo completo."""

from __future__ import annotations

import asyncio
import base64
import json
from collections.abc import AsyncIterator
from pathlib import Path

import numpy as np
import pytest
import websockets

from jarvstranscript import PROTOCOL_VERSION
from jarvstranscript.adapters.stt_container import STTContainer
from jarvstranscript.core.ports import TranscriptionFinal
from jarvstranscript.ipc.ws_server import WSServer
from jarvstranscript.settings.config import Settings
from jarvstranscript.settings.manager import ConfigManager


class FakeSTT:
    """STT determinístico — texto = 'fake-{calls}-{dur:.2f}s'."""

    def __init__(self, device: str = "cuda", model: str = "fake-stt") -> None:
        self.calls: list[np.ndarray] = []
        self._device = device
        self.model = model

    @property
    def device(self) -> str:
        return self._device

    async def transcribe_final(self, audio: np.ndarray) -> TranscriptionFinal:
        self.calls.append(audio.copy())
        dur = audio.size / 16_000
        return TranscriptionFinal(
            text=f"fake-{len(self.calls)}-{dur:.2f}s",
            latency_ms=3,
            confidence=0.88,
        )

    def close(self) -> None:
        pass


def _fake_factory(device: str = "cuda"):
    def make(model: str, dev: str) -> FakeSTT:
        return FakeSTT(device=device, model=model)
    return make


def _make_config(tmp_path: Path | None = None) -> ConfigManager:
    settings = Settings(model="fake-stt", device="cuda")
    stt = STTContainer(_fake_factory(), settings.model, settings.device)
    return ConfigManager(settings, stt, path=tmp_path / "config.json" if tmp_path else None)


@pytest.fixture
async def server(tmp_path: Path) -> AsyncIterator[WSServer]:
    config = _make_config(tmp_path)
    srv = WSServer(config=config, host="127.0.0.1", port=0)
    await srv.start()
    try:
        yield srv
    finally:
        await srv.stop()


class ScriptedVAD:
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


@pytest.fixture
async def server_toggle(tmp_path: Path) -> AsyncIterator[WSServer]:
    """Server com VAD scripted: 1° chunk = speech, demais = silence."""
    vad = ScriptedVAD([True] + [False] * 50)
    config = _make_config(tmp_path)
    srv = WSServer(config=config, vad=vad, host="127.0.0.1", port=0)
    await srv.start()
    try:
        yield srv
    finally:
        await srv.stop()


async def _recv_json(ws, timeout: float = 2.0) -> dict:
    raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
    return json.loads(raw)


def _b64_pcm(samples: np.ndarray) -> str:
    return base64.b64encode(samples.astype(np.float32).tobytes()).decode("ascii")


class TestHandshake:
    async def test_handshake_envia_ready_com_model_e_gpu(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            msg = await _recv_json(ws)
            assert msg["type"] == "ready"
            assert msg["protocol_version"] == PROTOCOL_VERSION
            assert msg["model"] == "fake-stt"
            assert msg["gpu"] is True

    async def test_ping_responde_pong(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            await _recv_json(ws)
            await ws.send(json.dumps({"type": "ping"}))
            assert await _recv_json(ws) == {"type": "pong"}

    async def test_tipo_desconhecido_devolve_error(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            await _recv_json(ws)
            await ws.send(json.dumps({"type": "voar"}))
            msg = await _recv_json(ws)
            assert msg["type"] == "error"
            assert msg["code"] == "unknown_type"

    async def test_json_invalido_devolve_error(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            await _recv_json(ws)
            await ws.send("nao e json {")
            msg = await _recv_json(ws)
            assert msg["type"] == "error"
            assert msg["code"] == "invalid_json"


class TestSessionFlow:
    async def test_audio_chunk_sem_session_start_devolve_error(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            await _recv_json(ws)
            await ws.send(
                json.dumps({"type": "audio_chunk", "data": _b64_pcm(np.zeros(100)), "seq": 1})
            )
            msg = await _recv_json(ws)
            assert msg["type"] == "error"
            assert msg["code"] == "session_not_started"

    async def test_session_end_sem_session_start_devolve_error(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            await _recv_json(ws)
            await ws.send(json.dumps({"type": "session_end"}))
            msg = await _recv_json(ws)
            assert msg["type"] == "error"
            assert msg["code"] == "session_not_started"

    async def test_fluxo_completo_emite_partials_e_final(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            await _recv_json(ws)  # ready
            await ws.send(
                json.dumps({"type": "session_start", "mode": "ptt", "polish": True, "lang": "pt"})
            )

            # 3s de audio em chunks de 0.5s — interval default 1.5s -> ao menos 2 partials
            chunk_samples = int(0.5 * 16_000)
            total_chunks = 6  # 3s
            samples = np.random.uniform(-0.1, 0.1, chunk_samples).astype(np.float32)
            for seq in range(1, total_chunks + 1):
                await ws.send(
                    json.dumps(
                        {"type": "audio_chunk", "data": _b64_pcm(samples), "seq": seq}
                    )
                )

            await ws.send(json.dumps({"type": "session_end"}))

            partials: list[dict] = []
            final: dict | None = None
            for _ in range(10):
                msg = await _recv_json(ws, timeout=3.0)
                if msg["type"] == "partial":
                    partials.append(msg)
                elif msg["type"] == "final":
                    final = msg
                    break

            assert final is not None, "final nao chegou"
            assert len(partials) >= 1, f"esperava ao menos 1 partial, recebi {len(partials)}"
            assert final["type"] == "final"
            assert final["polish_applied"] is False
            assert final["text_polished"] is None
            assert "fake" in final["text_raw"]  # FakeSTT marca

    async def test_audio_chunk_payload_malformado_devolve_error(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            await _recv_json(ws)
            await ws.send(json.dumps({"type": "session_start", "mode": "ptt"}))
            # base64 de 3 bytes — nao multiplo de 4 (float32)
            await ws.send(
                json.dumps(
                    {"type": "audio_chunk", "data": base64.b64encode(b"abc").decode(), "seq": 1}
                )
            )
            msg = await _recv_json(ws)
            assert msg["type"] == "error"
            assert msg["code"] == "audio_decode_failed"

    async def test_cancel_descarta_sessao_silenciosamente(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            await _recv_json(ws)
            await ws.send(json.dumps({"type": "session_start", "mode": "ptt"}))
            await ws.send(json.dumps({"type": "cancel"}))
            # cancel nao deve emitir nada
            # depois disso, audio_chunk deve ser tratado como sem sessao
            await ws.send(
                json.dumps(
                    {"type": "audio_chunk", "data": _b64_pcm(np.zeros(100)), "seq": 1}
                )
            )
            msg = await _recv_json(ws, timeout=2.0)
            assert msg["type"] == "error"
            assert msg["code"] == "session_not_started"

    async def test_segunda_sessao_apos_session_end_funciona(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            await _recv_json(ws)
            # primeira sessao
            await ws.send(json.dumps({"type": "session_start", "mode": "ptt"}))
            await ws.send(json.dumps({"type": "session_end"}))
            final1 = await _recv_json(ws)
            assert final1["type"] == "final"
            # segunda sessao na mesma conexao
            await ws.send(json.dumps({"type": "session_start", "mode": "ptt"}))
            await ws.send(json.dumps({"type": "session_end"}))
            final2 = await _recv_json(ws)
            assert final2["type"] == "final"

    async def test_final_em_ptt_marca_auto_ended_false(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            await _recv_json(ws)
            await ws.send(json.dumps({"type": "session_start", "mode": "ptt"}))
            await ws.send(json.dumps({"type": "session_end"}))
            final = await _recv_json(ws)
            assert final["type"] == "final"
            assert final["auto_ended"] is False


class TestToggleAutoEnd:
    async def test_toggle_com_vad_silencio_dispara_final_auto_ended(
        self, server_toggle: WSServer
    ) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server_toggle.port}") as ws:
            await _recv_json(ws)  # ready
            await ws.send(
                json.dumps({"type": "session_start", "mode": "toggle", "polish": False, "lang": "pt"})
            )

            chunk_samples = int(0.5 * 16_000)  # 0.5s
            samples = np.random.uniform(-0.1, 0.1, chunk_samples).astype(np.float32)
            payload = _b64_pcm(samples)

            # 1° chunk = speech (scripted) + 8 chunks = silence (4s, > 3s limiar)
            for seq in range(1, 10):
                await ws.send(
                    json.dumps({"type": "audio_chunk", "data": payload, "seq": seq})
                )

            # Coleta mensagens até pegar o final
            final: dict | None = None
            deadline = 6.0
            while final is None and deadline > 0:
                try:
                    msg = await _recv_json(ws, timeout=2.0)
                except Exception:
                    break
                if msg["type"] == "final":
                    final = msg

            assert final is not None, "final auto_ended nao chegou"
            assert final["auto_ended"] is True, f"esperava auto_ended=true, recebi {final}"

    async def test_toggle_sem_speech_nao_dispara_auto_end(
        self, server_toggle: WSServer, tmp_path: Path
    ) -> None:
        """Se o VAD não detectar speech, sessão NÃO encerra sozinha mesmo com chunks."""
        from jarvstranscript.ipc.ws_server import WSServer

        all_silence_vad = ScriptedVAD([False] * 100)
        config = _make_config(tmp_path / "alt")
        srv = WSServer(config=config, vad=all_silence_vad, host="127.0.0.1", port=0)
        await srv.start()
        try:
            async with websockets.connect(f"ws://127.0.0.1:{srv.port}") as ws:
                await _recv_json(ws)
                await ws.send(json.dumps({"type": "session_start", "mode": "toggle"}))

                chunk_samples = int(0.5 * 16_000)
                samples = np.zeros(chunk_samples, dtype=np.float32)
                payload = _b64_pcm(samples)
                for seq in range(1, 12):
                    await ws.send(
                        json.dumps({"type": "audio_chunk", "data": payload, "seq": seq})
                    )

                # Drena partials que chegarem (são esperados, vad nao afeta partials).
                # Garante que NENHUM final apareceu sozinho.
                import time as _time

                end = _time.monotonic() + 1.0
                while _time.monotonic() < end:
                    try:
                        raw = await asyncio.wait_for(ws.recv(), timeout=0.3)
                        msg = json.loads(raw)
                        assert msg["type"] != "final", (
                            f"final inesperado sem speech detectado: {msg}"
                        )
                    except (asyncio.TimeoutError, TimeoutError):
                        continue

                # Encerra manualmente — deve sair final auto_ended=False
                await ws.send(json.dumps({"type": "session_end"}))
                final = None
                while final is None:
                    raw = await asyncio.wait_for(ws.recv(), timeout=2.0)
                    msg = json.loads(raw)
                    if msg["type"] == "final":
                        final = msg
                assert final["auto_ended"] is False
        finally:
            await srv.stop()


class TestConfigHotReload:
    async def test_get_config_devolve_snapshot_atual(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            await _recv_json(ws)  # ready
            await ws.send(json.dumps({"type": "get_config"}))
            msg = await _recv_json(ws)
            assert msg["type"] == "config"
            assert msg["settings"]["model"] == "fake-stt"

    async def test_set_config_aplica_reload_de_modelo(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            await _recv_json(ws)  # ready
            await ws.send(
                json.dumps({"type": "set_config", "config": {"model": "outro-modelo"}})
            )
            msg = await _recv_json(ws)
            assert msg["type"] == "config_applied"
            assert msg["settings"]["model"] == "outro-modelo"
            assert msg["reload"] is not None
            assert msg["reload"]["changed"] is True
            assert msg["reload"]["model"] == "outro-modelo"

    async def test_set_config_apenas_mode_nao_dispara_reload(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            await _recv_json(ws)
            await ws.send(
                json.dumps({"type": "set_config", "config": {"mode": "toggle"}})
            )
            msg = await _recv_json(ws)
            assert msg["type"] == "config_applied"
            assert msg["settings"]["mode"] == "toggle"
            assert msg["reload"] is None

    async def test_set_config_filtra_campos_desconhecidos(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            await _recv_json(ws)
            await ws.send(
                json.dumps(
                    {"type": "set_config", "config": {"campo_que_nao_existe": "x"}}
                )
            )
            msg = await _recv_json(ws)
            assert msg["type"] == "config_applied"
            assert "campo_que_nao_existe" not in msg["settings"]

    async def test_set_config_payload_invalido_devolve_error(self, server: WSServer) -> None:
        async with websockets.connect(f"ws://127.0.0.1:{server.port}") as ws:
            await _recv_json(ws)
            await ws.send(json.dumps({"type": "set_config", "config": "nao e dict"}))
            msg = await _recv_json(ws)
            assert msg["type"] == "error"
            assert msg["code"] == "config_invalid"
