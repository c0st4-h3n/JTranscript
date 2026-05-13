"""Smoke test ponta-a-ponta — Fase 0.

Sobe o backend como processo de verdade (não in-process), conecta via WebSocket
de um cliente separado e exercita o ciclo:

    boot -> ready -> ping -> pong -> shutdown

Diferente de `test_ws_server.py` (unit/integration in-process), este garante que
o entry-point `python -m jarvstranscript.main` funciona, que o servidor escuta
na porta combinada (7979), e que um cliente terceiro conecta sem ajuste fino.

Roda fora do pytest (script standalone) pra ser também o que a Fase 0 considera
'smoke verde ponta-a-ponta'.
"""

from __future__ import annotations

import asyncio
import json
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

BACKEND_PORT = 7979
BACKEND_HOST = "127.0.0.1"
BOOT_TIMEOUT_S = 10.0


def _port_aceita(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.2)
        return s.connect_ex((host, port)) == 0


def _aguarda_porta(host: str, port: int, timeout: float) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if _port_aceita(host, port):
            return
        time.sleep(0.1)
    raise TimeoutError(f"backend nao subiu em {host}:{port} em {timeout}s")


async def _cliente_smoke(port: int) -> None:
    import websockets

    uri = f"ws://{BACKEND_HOST}:{port}"
    async with websockets.connect(uri) as ws:
        # 1) backend deve mandar `ready` ao conectar
        ready_raw = await asyncio.wait_for(ws.recv(), timeout=3.0)
        ready = json.loads(ready_raw)
        assert ready["type"] == "ready", f"esperava ready, recebi {ready}"
        assert ready.get("protocol_version") == 1, f"versao inesperada: {ready}"
        print(f"[smoke] ready ok — model={ready.get('model')} gpu={ready.get('gpu')}")

        # 2) ping -> pong
        await ws.send(json.dumps({"type": "ping"}))
        pong_raw = await asyncio.wait_for(ws.recv(), timeout=3.0)
        pong = json.loads(pong_raw)
        assert pong == {"type": "pong"}, f"esperava pong, recebi {pong}"
        print("[smoke] ping->pong ok")


def main() -> int:
    backend_root = Path(__file__).resolve().parent.parent
    py = backend_root / ".venv" / "Scripts" / "python.exe"
    if not py.exists():
        py = Path(sys.executable)

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    print(f"[smoke] subindo backend via {py}")
    proc = subprocess.Popen(
        [str(py), "-m", "jarvstranscript.main"],
        cwd=backend_root,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    try:
        _aguarda_porta(BACKEND_HOST, BACKEND_PORT, BOOT_TIMEOUT_S)
        print(f"[smoke] backend escutando em {BACKEND_HOST}:{BACKEND_PORT}")
        asyncio.run(_cliente_smoke(BACKEND_PORT))
        print("[smoke] ponta-a-ponta verde")
        return 0
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()


if __name__ == "__main__":
    raise SystemExit(main())
