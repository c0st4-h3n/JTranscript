# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased]

Preparação da v1.0. Veja [PLAN.md](PLAN.md) pro roadmap e [docs/adr/](docs/adr/)
pras decisões grandes.

## [0.0.1] - 2026-05-13

### Adicionado

**Pipeline STT (Fases 1+2)**
- `WhisperAdapter` faster-whisper GPU (default `large-v3-turbo`, configurável).
- `STTContainer` envolve adapter com hot-reload de modelo + lock async.
- `StreamingSession` com sliding window 1.5s + overlap 200ms, partials incrementais.
- VAD silero pro modo toggle, encerra sessão após silêncio (default 3s).
- Fallback `RmsVAD` se silero falhar.
- Cleanup automático cache HuggingFace ao trocar modelo (só mantém o atual).

**Frontend (Fases 3+5)**
- `MicRecorder` WebAudio + AudioWorklet 16kHz mono PCM float32.
- Encoder PCM float32 ↔ base64 portátil (browser + Node).
- Pill flutuante minimalista capsule (420×72), bottom-right, glass blur,
  spring entry. 3 dots VU estilo Siri reativos ao RMS.
- Settings UI sem chrome do OS, ESC fecha, hot-reload de model/device/mode.
- Tokens de design compartilhados (`src/ui/tokens.ts`) pra coerência Pill ↔ Settings.

**IPC + Sessão (Fases 0+3.5+4)**
- WebSocket localhost:7979, protocolo versionado v1.
- `SessionHandler` per-conexão orquestra `session_start`/`audio_chunk`/`session_end`/`cancel`.
- Hotkey global `F8` (PTT/Toggle hot-swap) + `Ctrl+Alt+S` (Settings).
- Captura HWND da app focada no `Pressed` via WinAPI.
- Toggle behavior consistente entre Rust shell e backend (mode hot-reload).

**Paste (Fase 6)**
- `HybridInserter`: clipboard primary + SendInput fallback ao falhar.
- Restaura foco via `SetForegroundWindow` antes do paste.

**Settings + persistência (Fase 9)**
- `data/config.json` versionado.
- WS `get_config`/`set_config` + `ConfigManager` orquestrando disco + STT reload.
- Hot-reloadable: `model`, `device`, `mode`. Demais persistem mas exigem restart.

**Build + dev**
- Script `scripts\dev.ps1` sobe backend + Tauri dev em uma sessão.
- 183 testes verdes (31 cargo + 48 vitest + 104 pytest) + typecheck strict.

### Decisões registradas

- [ADR 0001](docs/adr/0001-monorepo-standalone.md) — Monorepo standalone (sem dep do Jarvinho).
- [ADR 0003](docs/adr/0003-paste-hibrido.md) — Paste híbrido clipboard+SendInput.
- [ADR 0004](docs/adr/0004-polish-qwen-default.md) — Polish Qwen (adiado v1, talvez v1.1).
- [ADR 0005](docs/adr/0005-hotkey-pattern-ctrl-alt.md) — Hotkey `F8` + `Ctrl+Alt+S` (supera ADR 0002).
