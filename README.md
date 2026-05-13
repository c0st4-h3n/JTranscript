# JarvsTranscript

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: pre-release](https://img.shields.io/badge/status-pre--release-orange.svg)](#status)
[![Platform: Windows 11](https://img.shields.io/badge/platform-Windows%2011-blue.svg)](#)
[![GPU: NVIDIA CUDA 12+](https://img.shields.io/badge/GPU-NVIDIA%20CUDA%2012%2B-green.svg)](#gpu--cuda)

Widget local de transcrição em tempo real pra Windows 11. STT GPU (`faster-whisper large-v3-turbo`) + paste híbrido clipboard+SendInput. Atalhos globais: **`F8`** (gravar — hold-to-talk ou toggle) e **`Ctrl+Alt+S`** (settings). Pill flutuante minimalista. Zero rede.

Repo: [c0st4-h3n/JTranscript](https://github.com/c0st4-h3n/JTranscript) · Roadmap completo em [PLAN.md](PLAN.md) · Decisões grandes em [docs/adr/](docs/adr/) · Protocolo IPC em [docs/PROTOCOLO_WS.md](docs/PROTOCOLO_WS.md) · Changelog em [CHANGELOG.md](CHANGELOG.md).

## Status

| Fase | Status |
|---|---|
| 0 — Foundation (scaffold 3 camadas, WS ping/pong, 1 teste por camada) | ✅ pronto |
| 1 — STT pipeline backend (WhisperAdapter GPU + audio codec + fixture edge-tts) | ✅ pronto |
| 2 — Streaming sliding window (StreamingSession + partials incrementais + pass final) | ✅ pronto |
| 3 — Captura áudio frontend (WebAudio 16kHz mono + envio WS chunked + VU + msgs do protocolo) | ✅ pronto |
| 4 — Hotkey global + sessão PTT (F8, HWND capturado no on_press, bridge frontend) | ✅ pronto |
| 5 — Widget pill (380x88 hidden-default, bottom-right, dot pulsante + VU + texto) | ✅ pronto |
| 6 — Paste clipboard + SendInput fallback (cola o texto no app focado) | ✅ pronto |
| 7 — Modo toggle + VAD silero (auto-end por silêncio 3s) | ✅ pronto |
| 8 — Polish Qwen (refina pontuação/capitalização/fillers em PT-BR) | adiado (overkill no MVP) |
| 9 — Settings + persistência | pendente |

## GPU / CUDA

`faster-whisper` precisa de cuBLAS + cuDNN + cudart no DLL search path. As wheels [`nvidia-cublas-cu12`](https://pypi.org/project/nvidia-cublas-cu12/), [`nvidia-cudnn-cu12`](https://pypi.org/project/nvidia-cudnn-cu12/) e [`nvidia-cuda-runtime-cu12`](https://pypi.org/project/nvidia-cuda-runtime-cu12/) entregam os DLLs no `site-packages/nvidia/.../bin`. O módulo [`jarvstranscript.net.gpu_bootstrap`](backend/src/jarvstranscript/net/gpu_bootstrap.py) (a) chama `os.add_dll_directory` mantendo os cookies vivos no processo, e (b) prepend nos bin dirs no `PATH` — necessário porque o loader legacy do CTranslate2 ignora `AddDllDirectory`. Sem isso, `cublas64_12.dll is not found or cannot be loaded` no `encode()`.

## Estrutura

```
JarvsTranscript/
├── backend/          # Python 3.12 — WS server + STT pipeline (Whisper) + polish (Qwen)
├── src/              # Frontend React 19 + Vite + Vitest
├── src-tauri/        # Tauri 2 shell — hotkey global + inserter (clipboard/SendInput)
├── docs/
│   ├── adr/          # Architecture Decision Records
│   └── PROTOCOLO_WS.md
└── PLAN.md
```

## Setup

Pré-reqs: Python 3.12, Node 22+, Rust 1.77+, GPU NVIDIA (CUDA 12+).

```powershell
# backend
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
cd ..

# frontend
npm install
```

## Rodar

**Atalho — sobe os dois com um comando:**

```powershell
.\scripts\dev.ps1                                # default: model='tiny', device='auto'
.\scripts\dev.ps1 -Model large-v3-turbo          # modelo alvo do MVP (~1.5GB)
.\scripts\dev.ps1 -Model tiny -Device cpu        # CPU forçado pra debug
```

O script sobe o backend em janela separada (envs `JARVSTRANSCRIPT_MODEL` e `JARVSTRANSCRIPT_DEVICE`), aguarda a porta `7979` aceitar, e dispara `npm run tauri dev`. `Ctrl+C` no console encerra ambos.

**Manual (2 terminais):**

```powershell
# terminal 1 — backend
$env:JARVSTRANSCRIPT_MODEL = "tiny"
backend\.venv\Scripts\python.exe -m jarvstranscript.main

# terminal 2 — widget Tauri
npm run tauri dev
```

Backend escuta em `ws://127.0.0.1:7979`. Frontend Vite em `http://localhost:1420`.

## Como testar a captura ponta-a-ponta

Com o `dev.ps1` rodando e a janela do Tauri aberta:

1. Confere o status — deve aparecer `ws: connected — model tiny, gpu=true, proto v1` e `mic: idle`.
2. **Segura** o botão `segurar para ditar` (mouse down). O botão fica vermelho, `mic: recording`, e a barra VU reage à voz.
3. Fala uma frase em PT-BR (3-5s).
4. **Solta** o botão. Em ~200-800ms aparecem:
   - `partials` progressivos (cada um é um trecho transcrito) — qualidade modesta no `tiny`, melhor no `large-v3-turbo`
   - `final` em destaque — pass holístico sobre tudo, mais preciso

Primeira execução baixa o modelo (`tiny` ~75MB, `large-v3-turbo` ~1.5GB) — vai pro cache da HuggingFace em `~\.cache\huggingface`.

## Testes

```powershell
# backend
backend\.venv\Scripts\python.exe -m pytest backend

# frontend
npm test
npm run typecheck

# rust shell
cd src-tauri
cargo test --lib

# smoke ponta-a-ponta (boot real, ping/pong)
backend\.venv\Scripts\python.exe backend\tests\smoke_e2e.py
```

Regra do TDD aqui: sub-fase só é considerada pronta com suite verde nas 3 camadas. Se algo regrediu, pausa, investiga, conserta — não acumular dívida.
