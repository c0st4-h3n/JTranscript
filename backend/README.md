# JarvsTranscript — Backend Python

Backend slim do widget JarvsTranscript: WebSocket IPC + pipeline STT (Whisper) + polish opcional (Qwen via Ollama).

## Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
```

## Rodar

```powershell
python -m jarvstranscript.main
```

Servidor sobe em `ws://127.0.0.1:7979`.

## Testes

```powershell
pytest
```

Sub-fase só é considerada pronta quando `pytest` está verde.
