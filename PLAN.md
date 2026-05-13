# JarvsTranscript — Plano de Ação

**Projeto:** widget de transcrição em tempo real, 100% local, estilo OpenWhispr porém com motor de STT GPU + polish PT-BR do Jarvinho.
**Plataforma alvo:** Windows 11 (GPU NVIDIA).
**Princípio:** local-first, privacidade total, zero rede, Clean Architecture + SOLID + TDD obrigatório.
**Repo:** standalone (sem dependência do Jarvinho rodando), próprio monorepo.

---

## 0. Resumo executivo

JarvsTranscript é um app de desktop minimalista que escuta o microfone, transcreve em tempo real via `faster-whisper large-v3-turbo` na GPU, opcionalmente refina o texto com Qwen 2.5 7B local (Ollama) e **cola o resultado no campo de texto que estiver com foco** em qualquer aplicação do Windows. Toda a operação acontece através de uma hotkey global única (`Ctrl+Shift+R`), com pill flutuante mostrando o progresso da transcrição.

**Diferencial vs OpenWhispr:**
- STT GPU pesado (não cloud, não modelo `tiny`/`base`).
- Polish PT-BR via Qwen local (pontuação, capitalização, remoção de filler words).
- Modo hold-to-talk **e** toggle configuráveis na mesma hotkey.
- Paste híbrido (clipboard + fallback SendInput) pra cobrir apps refratárias.
- Logs estruturados JSONL como o Jarvinho.

---

## 1. Decisões travadas

| Decisão | Escolha | Motivo |
|---|---|---|
| Nome | **JarvsTranscript** | Definido pelo Henrique |
| Local do código | **Repo novo standalone** | Independência total do Jarvinho |
| Hotkey global | **`Ctrl+Shift+R`** (única, configurável) | Definida pelo Henrique |
| Modo de captura | **Hold-to-talk** *e* **toggle** (mesma hotkey, modo escolhido em settings) | Cobre rajada curta e dictation longo |
| Inserção de texto | **Híbrido**: clipboard paste default + fallback SendInput pra apps refratárias | Clipboard rápido + unicode perfeito; SendInput resgata casos limite |
| Speech polish | **Qwen 2.5 ON por padrão**, toggle no widget pra desligar | Qualidade alta em PT-BR; usuário decide se quer ganhar latência |
| Idioma do MVP | A confirmar (sugestão: PT-BR + EN no mesmo binário) | — |

---

## 2. Arquitetura

Três processos com IPC local — mesma filosofia do Jarvinho mas enxuta (sem cérebro Claude, sem grafo, sem skills).

```
┌──────────────────────────────────────────────────────────────┐
│                    WIDGET (Tauri + React)                    │
│  • Pill flutuante  • Settings  • Captura mic via WebAudio    │
│  • Hotkey global (tauri-plugin-global-shortcut)              │
│  • Clipboard + SendInput (Rust: arboard + enigo)             │
└────────────────────────┬─────────────────────────────────────┘
                         │ WebSocket localhost:7979
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                BACKEND (Python asyncio slim)                  │
│  • Sliding-window streaming STT                              │
│  • VAD silero                                                │
│  • Polish opcional via Qwen (Ollama HTTP)                    │
│  • Logs JSONL                                                │
└────┬─────────────────────┬─────────────────────┬─────────────┘
     ▼                     ▼                     ▼
┌─────────┐         ┌────────────┐         ┌──────────┐
│  STT    │         │   POLISH   │         │  LOGS    │
│ Whisper │         │ Qwen 2.5   │         │  JSONL   │
│ large-  │         │ via Ollama │         │ rotativo │
│ v3-turbo│         │ (opcional) │         │          │
└─────────┘         └────────────┘         └──────────┘
```

**Clean Architecture aplicada (`principles_architecture.md`):**
- **Núcleo:** `core/` com regras puras (`Transcription`, `DictationSession`, `Insertion`) — não conhece Whisper, Tauri, Ollama.
- **Adapters:** `adapters/stt_whisper.py`, `adapters/polish_qwen.py`, `adapters/polish_regex.py`, `inserter/clipboard.rs`, `inserter/sendinput.rs`.
- **Ports:** interfaces `STTPort`, `PolishPort`, `InserterPort` — testáveis com fakes.
- **Separation of concerns:** trocar Whisper por Vosk amanhã NÃO toca o `core`.

**Dependências:** apontam só pra dentro. Frontend ↔ Backend via contrato WebSocket versionado.

---

## 3. Stack

### 3.1 Backend Python 3.12

| Função | Lib | Notas |
|---|---|---|
| STT | `faster-whisper` large-v3-turbo FP16 GPU | Reaproveitar expertise CUDA do Jarvinho (cublas/cudnn wheels via pip nvidia-*, DNS override HF, `HF_ENDPOINT=https://hf-mirror.com`) |
| VAD | `silero-vad` v5 | Detecta fim natural no modo toggle |
| Polish | `httpx` → Ollama `qwen2.5:7b-instruct-q4_K_M` | Modelo já baixado se o Jarvinho está instalado |
| WebSocket | `websockets` | localhost:**7979** (Jarvinho usa 7878 — sem conflito) |
| Logs | `structlog` → JSONL | Padrão do `ipc/log_stream.py` do Jarvinho replicado |
| Tests | `pytest` + `pytest-asyncio` + `pytest-cov` | TDD obrigatório |

### 3.2 Frontend Tauri v2 + React 19 + TS

| Função | Lib |
|---|---|
| Shell | Tauri 2.x |
| UI | React 19 + Vite + Tailwind v4 |
| Componentes base | shadcn/ui (subset mínimo — Button, Switch, Select) |
| Captura mic | Web Audio API + AudioWorklet (16kHz mono PCM float32) |
| Animações | Framer Motion (pill pulse, fade in/out) |
| State | Zustand |
| Tests | Vitest + Testing Library |

### 3.3 Rust (src-tauri)

| Função | Crate |
|---|---|
| Hotkey global | `tauri-plugin-global-shortcut` |
| Clipboard | `arboard` |
| SendInput | `enigo` (Windows backend) |
| Janela always-on-top, transparente, no-decoration | API Tauri nativa |
| Autostart Windows | `tauri-plugin-autostart` |
| Tests | `cargo test` |

---

## 4. Fluxo end-to-end

### 4.1 Modo Hold-to-talk (default da hotkey)

```
1. Usuário SEGURA Ctrl+Shift+R
   └─> Rust: GlobalShortcut::on_press → emit "dictation:start"

2. Frontend recebe evento
   ├─> Salva HWND da janela focada (Tauri command -> WinAPI GetForegroundWindow)
   ├─> Mostra pill no canto inferior direito (animação fade+pulse)
   └─> Inicia captura WebAudio @ 16kHz mono

3. Frontend → Backend (WebSocket)
   ├─> {type: "session_start", mode: "ptt", polish: true, lang: "pt"}
   └─> {type: "audio_chunk", data: <pcm_float32_base64>} a cada 200ms

4. Backend
   ├─> VAD acumula áudio
   ├─> A cada 1.5s: roda Whisper em sliding window com overlap (200ms)
   └─> Emite {type: "partial", text: "...", confidence: 0.x, latency_ms: 187}

5. Frontend mostra partial dentro da pill (texto fade-in progressivo)

6. Usuário SOLTA Ctrl+Shift+R
   └─> Rust: on_release → emit "dictation:stop"

7. Frontend → Backend
   └─> {type: "session_end"}

8. Backend
   ├─> Whisper pass FINAL sobre buffer inteiro (corrige partials)
   ├─> Se polish=true: passa pelo Qwen (prompt PT-BR endurecido)
   ├─> Fallback regex se Qwen falhar/timeout
   └─> Emite {type: "final", text: "..."}

9. Frontend recebe final
   ├─> Pill mostra "colando..." (200ms)
   ├─> Rust: Inserter::insert(text)
   │    ├─> Restaura foco HWND original (SetForegroundWindow)
   │    ├─> Tenta clipboard: arboard.save_current() → set(text) → enigo Ctrl+V → restore() após 200ms
   │    └─> Se app na blocklist OU paste falhou: fallback enigo.text(text)
   └─> Pill some (fade out)
```

### 4.2 Modo Toggle (config alternativa da mesma hotkey)

Mesma coisa, mas:
- `on_press` toggla `is_recording` (sem reagir a `on_release`).
- Sessão fecha quando: (a) usuário aperta `Ctrl+Shift+R` de novo, ou (b) VAD detecta silêncio prolongado (3s configurável).
- Pill fica visível enquanto recording (com botão "parar" clicável como redundância).

### 4.3 Settings da hotkey

```json
{
  "hotkey": "Ctrl+Shift+R",
  "behavior": "hold" | "toggle",
  "silence_to_end_ms": 3000,
  "polish": true,
  "insert_method": "clipboard" | "sendinput" | "auto",
  "sendinput_apps_blocklist": ["mintty.exe", "wsl.exe"],
  "language": "pt" | "en" | "auto"
}
```

---

## 5. Estrutura de pastas

```
JarvsTranscript/
├── src-tauri/                    # Shell Rust
│   ├── src/
│   │   ├── main.rs
│   │   ├── hotkey.rs             # registra hotkeys globais + dispatch eventos
│   │   ├── inserter/
│   │   │   ├── mod.rs            # trait Inserter
│   │   │   ├── clipboard.rs      # arboard + enigo paste
│   │   │   └── sendinput.rs      # enigo keystrokes
│   │   ├── window_focus.rs       # captura/restaura HWND ativo
│   │   ├── settings.rs           # leitura/escrita config.json
│   │   └── commands.rs           # @tauri::command exports
│   ├── tests/
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                          # Frontend React
│   ├── components/
│   │   ├── Pill.tsx              # widget flutuante
│   │   ├── PartialText.tsx
│   │   ├── Settings.tsx          # janela settings
│   │   └── ui/                   # shadcn primitives
│   ├── hooks/
│   │   ├── useDictationSocket.ts
│   │   ├── useHotkeyEvents.ts
│   │   └── useMicCapture.ts
│   ├── store/
│   │   └── dictationStore.ts     # Zustand
│   ├── App.tsx
│   └── main.tsx
│
├── backend/                      # Python
│   ├── src/jarvstranscript/
│   │   ├── core/                 # regras puras (sem deps externas)
│   │   │   ├── session.py
│   │   │   ├── transcription.py
│   │   │   └── ports.py          # STTPort, PolishPort
│   │   ├── adapters/
│   │   │   ├── stt_whisper.py
│   │   │   ├── polish_qwen.py
│   │   │   └── polish_regex.py   # fallback
│   │   ├── voice/
│   │   │   ├── vad.py
│   │   │   ├── audio_codec.py
│   │   │   └── streaming.py      # sliding window
│   │   ├── ipc/
│   │   │   ├── ws_server.py
│   │   │   └── log_stream.py
│   │   ├── net/
│   │   │   ├── dns_override.py
│   │   │   └── gpu_bootstrap.py
│   │   └── main.py
│   ├── tests/
│   └── pyproject.toml
│
├── docs/
│   ├── adr/                      # Architecture Decision Records
│   │   ├── 0001-monorepo-standalone.md
│   │   ├── 0002-hotkey-ctrl-shift-r.md
│   │   ├── 0003-paste-hibrido.md
│   │   └── 0004-polish-qwen-default.md
│   └── PROTOCOLO_WS.md           # contrato versionado do WebSocket
├── data/
│   ├── logs/                     # JSONL rotativo
│   └── config.json               # settings persistidos
├── PLAN.md
├── README.md
├── package.json
└── .gitignore
```

---

## 6. Roadmap em fases (TDD obrigatório, suite verde entre sub-fases)

A cada fim de fase (e idealmente de cada sub-fase), rodar `pytest` + `vitest` + `cargo test` e reportar `X testes verdes (Y backend / Z frontend / W rust)`. Se algo regrediu, pausa, investiga, conserta — não acumular dívida.

| Fase | Entrega | Duração estimada | Critério de "pronto" |
|---|---|---|---|
| **0 — Foundation** | Scaffold Tauri+React+Python, WebSocket localhost:7979 idle, smoke test ponta-a-ponta. ADR 0001 escrito. | 2-3 dias | Janela abre, WS conecta, ping/pong, 1 teste verde por camada |
| **1 — STT pipeline backend** | `STTPort` + `WhisperAdapter`, decode WAV→float32, transcrição chunk completo (sem streaming ainda) | 3-4 dias | `pytest`: transcribe áudio WAV fixture devolve texto esperado; GPU em uso confirmado |
| **2 — Streaming sliding window** | Buffer + VAD + sliding window c/ overlap; emite `partial` e `final` | 4-5 dias | Testes com áudio sintético validam partials progressivos + final corrigido |
| **3 — Captura áudio frontend** | `useMicCapture` WebAudio 16kHz mono, envio WS chunked, indicador VU básico | 2-3 dias | Vitest com AudioContext mockado valida shape de mensagens; smoke real no dev |
| **4 — Hotkey + sessão PTT** | `tauri-plugin-global-shortcut` registrado pra `Ctrl+Shift+R`, eventos `start/stop`, modo hold funcional ponta-a-ponta | 3-4 dias | Cargo test pra registro/dispatch; e2e manual: segura, fala, vê final no console |
| **5 — Widget pill** | Janela transparente, always-on-top, animação pill, exibe partial + final | 3 dias | Vitest dos componentes; visual smoke; pill aparece/some corretamente |
| **6 — Paste clipboard** | `arboard` save/restore + `enigo` Ctrl+V; captura HWND ativo + SetForegroundWindow | 3-4 dias | Cargo test do `Inserter` trait com fake; e2e: dita num Notepad e cola texto correto |
| **6.1 — Paste SendInput fallback** | `enigo.text()` como fallback; blocklist configurável; detecção automática de falha | 2 dias | Testa SendInput com unicode PT-BR (`ção`, `ã`, `é`, emoji) |
| **7 — Modo toggle + VAD end-of-speech** | Setting `behavior: toggle`, VAD silero detecta fim, sessão fecha sozinha | 3 dias | Testes do VAD com áudio que tem pausas; e2e modo toggle |
| **8 — Polish Qwen** | `PolishPort` + `QwenAdapter` via Ollama HTTP, prompt PT-BR endurecido, fallback regex se Ollama down/timeout | 3-4 dias | Testes com Qwen mockado validam input→output limpo; toggle no widget funciona |
| **9 — Settings + persistência** | Janela settings: hotkey, behavior, polish on/off, blocklist apps, autostart, idioma | 3 dias | Vitest do form; settings persistem em `data/config.json`; hot-reload sem reiniciar app |
| **10 — Logs + Cockpit mini** | JSONL rotativo, viewer simples (categorias `session.start`, `stt.partial`, `polish.done`, `insert.paste`, `insert.fallback`) | 2-3 dias | Categorias filtráveis; msgs ≤120 chars; sem emoji; PT-BR curto (regra `feedback_logs_style.md`) |
| **11 — Polish UX + MSI** | Ícone, system tray, autostart Windows, instalador MSI assinado | 3-4 dias | MSI instala em VM limpa; autostart funciona; smoke verde |

**Total estimado:** ~6-8 semanas em ritmo TDD.

---

## 7. Protocolo WebSocket (contrato versionado)

`docs/PROTOCOLO_WS.md` mantém a versão atual. Header opcional `protocol_version` em toda mensagem.

### Cliente → Servidor

| `type` | Payload |
|---|---|
| `session_start` | `{mode: "ptt"\|"toggle", polish: bool, lang: "pt"\|"en"\|"auto"}` |
| `audio_chunk` | `{data: base64_pcm_f32, seq: int}` |
| `session_end` | `{}` |
| `cancel` | `{}` (descarta sessão sem inserir) |
| `ping` | `{}` |

### Servidor → Cliente

| `type` | Payload |
|---|---|
| `ready` | `{model: "...", gpu: bool}` (após boot) |
| `partial` | `{text, confidence, latency_ms}` |
| `final` | `{text_raw, text_polished, polish_applied: bool}` |
| `error` | `{code, message}` |
| `pong` | `{}` |

---

## 8. Observabilidade (`feedback_logs_style.md` aplicado)

Categorias JSONL (rotação diária em `data/logs/`):

| `category` | Quando | Campos chave |
|---|---|---|
| `session.start` | Hotkey disparou | `mode`, `polish` |
| `session.end` | Sessão fechou | `reason: "manual"\|"vad"\|"cancel"`, `duration_ms` |
| `stt.partial` | Whisper emitiu partial | `text_len`, `latency_ms`, `confidence` |
| `stt.final` | Pass final pronto | `text_len`, `latency_ms` |
| `polish.run` / `polish.done` | Qwen chamado / retornou | `chars_in`, `chars_out`, `latency_ms`, `fallback: bool` |
| `insert.paste` | Clipboard paste OK | `chars`, `app` (exe name), `latency_ms` |
| `insert.fallback` | SendInput usado | `reason`, `app` |
| `insert.error` | Falha total | `error_type`, `error_msg` |
| `hotkey.conflict` | Registro de hotkey falhou | `combo`, `os_error` |

**Regras de log:**
- Sem `print()` no código de produção — só `log_stream.emit()`.
- Mensagens PT-BR curtas e factuais ("colado", não "operação de colagem concluída com sucesso").
- Latências/contagens como campos numéricos (`latency_ms=187`), não texto formatado.
- Sem stack traces no caminho feliz; erros em arquivo `trace.jsonl` separado.
- Sem emoji no `msg` (UI adiciona ícone).
- Linhas `msg` ≤120 chars.

---

## 9. Performance budget

| Etapa | Alvo |
|---|---|
| `Ctrl+Shift+R` press → pill aparece | <80ms |
| Áudio → primeiro partial | <600ms |
| Soltou hotkey → texto colado (sem polish) | <300ms após último chunk |
| Soltou hotkey → texto colado (com polish Qwen) | <1500ms após último chunk |
| Idle VRAM (Whisper carregado) | ~1.5GB |
| Idle RAM | <120MB |

---

## 10. Segurança & gotchas

- **Sem rede:** validar com firewall block durante testes. Ollama é localhost; Whisper offline; nada vai pra cloud. Threat model curto — superfície enxuta.
- **Clipboard race:** save/set/paste/restore precisa de mutex pra não conflitar com outras apps mexendo no clipboard simultaneamente. Restore tem timeout 200ms configurável.
- **Hotkey conflict:** muitos apps usam `Ctrl+Shift+R` (refresh forçado no Chrome, replace no VSCode etc.). Settings detecta conflito e sugere alternativa. **Esse é o gotcha #1** — pode merecer revisitar a default depois do MVP.
- **HWND focus restore:** alguns apps (UAC dialogs, sandbox de browser, jogos fullscreen) bloqueiam `SetForegroundWindow`. Documentar limitação no README.
- **Microfone permissions** (Windows 11): primeira execução pede permissão; widget guia o usuário em passo-a-passo.
- **GPU não disponível:** fallback CPU `faster-whisper small` (degrada qualidade, avisa em settings).
- **Privacidade:** audit log de paste guarda só `timestamp + app_exe_name + chars_count`. **NUNCA o texto colado.**
- **Secrets:** nada. Ollama é local sem auth. Não há tokens/keys no app.

---

## 11. CI/CD & qualidade (Secure by Design)

- **Pre-commit hooks:** `ruff` + `mypy` (Python), `prettier` + `eslint` (TS), `rustfmt` + `clippy` (Rust).
- **CI GitHub Actions:** `pytest` + `vitest` + `cargo test` em PR, build MSI em tag.
- **SAST/SCA:** `bandit` (Python), `cargo audit` (Rust), `npm audit` (Node) — build falha em vulnerabilidade crítica.
- **Code signing:** certificado pra MSI (~$200/ano) pra evitar SmartScreen. Pode entrar só na Fase 11.
- **ADRs:** toda decisão grande vira `docs/adr/NNNN-titulo.md` (já começamos com 4).
- **CODEOWNERS:** Henrique como dono inicial.

---

## 12. Próximos passos imediatos

Quando aprovar este plano:

1. **Confirmar idioma do MVP** (PT-BR só, ou PT-BR + EN?).
2. **Confirmar conflito de hotkey** (`Ctrl+Shift+R` colide com Chrome/VSCode — manter mesmo assim ou trocar agora?).
3. **Iniciar Fase 0** (Foundation): scaffold Tauri + React + Python backend, WebSocket idle, smoke test ponta-a-ponta. Compromisso TDD: cada camada com pelo menos 1 teste verde antes de chamar "pronto".
4. **Inicializar repo Git** local + GitHub (se quiser).

---

## Resumo

Tauri + React no frontend; Python asyncio amarrando `silero-vad` + `faster-whisper large-v3-turbo` + Qwen 2.5 polish opcional no backend; hotkey global `Ctrl+Shift+R` com modos hold-to-talk e toggle configuráveis; inserção híbrida clipboard+SendInput cobrindo apps refratárias; logs JSONL estruturados. Tudo local, sem rede, com TDD estrito entre sub-fases.

**Modo operandi:** teste escrito → falha → implementa → verde → só então "pronto". Suite completa rodada entre sub-fases. Logs limpos e bonitos desde o dia 1.
