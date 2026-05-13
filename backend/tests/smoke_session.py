"""Smoke ponta-a-ponta da sessão completa — simula o que o frontend faz.

Boot do backend real -> conecta WS -> session_start -> N audio_chunks (do MP3
do edge-tts) -> session_end -> coleta partials + final.

NÃO é um teste pytest. É o script que o Claude/Henrique roda pra validar que
o wiring backend está vivo sem precisar do Tauri dev + clicar+falar.
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

import numpy as np

BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 7979
CHUNK_DURATION_S = 0.2
SAMPLE_RATE = 16_000


def _port_aceita(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.2)
        return s.connect_ex((host, port)) == 0


def _aguarda_porta(host: str, port: int, timeout: float) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if _port_aceita(host, port):
            return
        time.sleep(0.2)
    raise TimeoutError(f"backend nao subiu em {host}:{port} em {timeout}s")


async def _cliente(audio: np.ndarray) -> dict:
    import websockets

    chunk_samples = int(CHUNK_DURATION_S * SAMPLE_RATE)
    uri = f"ws://{BACKEND_HOST}:{BACKEND_PORT}"
    async with websockets.connect(uri) as ws:
        ready = json.loads(await asyncio.wait_for(ws.recv(), timeout=5.0))
        assert ready["type"] == "ready", f"esperava ready, recebi {ready}"
        print(
            f"[smoke] ready ok — model={ready.get('model')} "
            f"gpu={ready.get('gpu')} proto v{ready.get('protocol_version')}"
        )

        await ws.send(
            json.dumps({"type": "session_start", "mode": "ptt", "polish": True, "lang": "pt"})
        )
        print("[smoke] session_start enviado")

        seq = 0
        for start in range(0, audio.size, chunk_samples):
            chunk = audio[start : start + chunk_samples].astype(np.float32, copy=False)
            payload = base64.b64encode(chunk.tobytes()).decode("ascii")
            seq += 1
            await ws.send(json.dumps({"type": "audio_chunk", "data": payload, "seq": seq}))
        print(f"[smoke] {seq} chunks enviados ({audio.size / SAMPLE_RATE:.2f}s de audio)")

        await ws.send(json.dumps({"type": "session_end"}))
        print("[smoke] session_end enviado — aguardando partials + final...")

        partials: list[dict] = []
        final: dict | None = None
        deadline = time.monotonic() + 30.0
        while time.monotonic() < deadline:
            msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=5.0))
            if msg["type"] == "partial":
                partials.append(msg)
                print(
                    f"[smoke] partial #{len(partials)}: +{msg['latency_ms']}ms "
                    f"conf={msg.get('confidence', 0):.2f}  text={msg['text']!r}"
                )
            elif msg["type"] == "final":
                final = msg
                print(
                    f"[smoke] FINAL:   +{msg['latency_ms']}ms  "
                    f"polished={msg.get('polish_applied')}  text={msg['text_raw']!r}"
                )
                break
            elif msg["type"] == "error":
                print(f"[smoke] !!! server error: {msg}")
                final = msg
                break
            else:
                print(f"[smoke] msg inesperada: {msg}")

        return {"partials": partials, "final": final}


def main() -> int:
    backend_root = Path(__file__).resolve().parent.parent
    py = backend_root / ".venv" / "Scripts" / "python.exe"
    if not py.exists():
        py = Path(sys.executable)

    fixture = backend_root / "tests" / "fixtures" / "hello_mundo_pt.mp3"
    if not fixture.exists():
        print(f"[smoke] fixture nao encontrada em {fixture}")
        print("[smoke] rode 'pytest backend/tests/test_audio_codec.py' uma vez pra gerar")
        return 2

    from jarvstranscript.voice.audio_codec import load_audio_file

    audio = load_audio_file(fixture)
    print(f"[smoke] fixture: {audio.size / SAMPLE_RATE:.2f}s @ {SAMPLE_RATE}Hz")

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    env.setdefault("JARVSTRANSCRIPT_MODEL", "tiny")
    env.setdefault("JARVSTRANSCRIPT_DEVICE", "auto")

    print(
        f"[smoke] subindo backend (model={env['JARVSTRANSCRIPT_MODEL']} "
        f"device={env['JARVSTRANSCRIPT_DEVICE']})..."
    )
    proc = subprocess.Popen(
        [str(py), "-m", "jarvstranscript.main"],
        cwd=backend_root,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    try:
        _aguarda_porta(BACKEND_HOST, BACKEND_PORT, timeout=30.0)
        print(f"[smoke] backend pronto em {BACKEND_HOST}:{BACKEND_PORT}")
        result = asyncio.run(_cliente(audio))

        final = result["final"]
        if final is None:
            print("[smoke] FAIL — final nao chegou")
            return 1
        if final.get("type") == "error":
            print(f"[smoke] FAIL — server error: {final}")
            return 1
        if not final.get("text_raw", "").strip():
            print(f"[smoke] FAIL — texto final vazio: {final}")
            return 1
        print("[smoke] PASS — sessao ponta-a-ponta verde")
        return 0
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()


if __name__ == "__main__":
    raise SystemExit(main())
