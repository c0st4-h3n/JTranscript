# Protocolo WebSocket — JarvsTranscript

**Versão atual:** `1` (header opcional `protocol_version` em toda mensagem).
**Endpoint:** `ws://127.0.0.1:7979`.
**Encoding:** JSON UTF-8.

Toda mensagem tem o campo `type` (string). O resto do payload depende do tipo.

---

## 1. Cliente → Servidor

| `type` | Payload | Quando |
|---|---|---|
| `ping` | `{}` | Healthcheck. Servidor responde `pong`. |
| `session_start` | `{mode: "ptt" \| "toggle", polish: bool, lang: "pt"}` | Hotkey disparou, gravação começou. |
| `audio_chunk` | `{data: <base64 PCM float32 16kHz mono>, seq: int}` | Cada ~200ms enquanto grava. |
| `session_end` | `{}` | Usuário soltou hotkey (PTT) ou bateu de novo (toggle). |
| `cancel` | `{}` | Descarta sessão sem gerar final nem inserir. |
| `get_config` | `{}` | Frontend pede o snapshot atual do `Settings`. |
| `set_config` | `{config: {model?, device?, mode?, vad?, silence_to_end_ms?, ...}}` | Aplica patch parcial no `Settings`. Hot-reloadable: `model`, `device`. Demais campos persistem mas exigem restart. |

> No MVP, `lang` é fixo `"pt"`. Campo existe pra suportar EN no futuro sem quebrar versão.

---

## 2. Servidor → Cliente

| `type` | Payload | Quando |
|---|---|---|
| `ready` | `{model: string, gpu: bool, protocol_version: int}` | Após boot, antes de aceitar `session_start`. |
| `pong` | `{}` | Resposta de `ping`. |
| `partial` | `{text: string, confidence: float, latency_ms: int, seq: int}` | Whisper emitiu transcrição parcial em sliding window. |
| `final` | `{text_raw: string, text_polished: string \| null, polish_applied: bool, latency_ms: int, auto_ended: bool}` | Pass final do Whisper concluído. `auto_ended=true` quando VAD encerrou (modo toggle). |
| `config` | `{settings: {...}}` | Resposta de `get_config`. |
| `config_applied` | `{settings: {...}, reload: ReloadResult \| null}` | Resposta de `set_config`. `reload` preenchido se `model`/`device` mudaram. |
| `error` | `{code: string, message: string}` | Erro recuperável (não fecha a conexão). |

### Códigos de erro

| `code` | Significado |
|---|---|
| `audio_decode_failed` | Chunk PCM inválido. |
| `gpu_unavailable` | GPU sumiu (CUDA OOM, driver crash). Sessão abortada. |
| `polish_timeout` | Qwen demorou demais; backend usa `text_raw` no `final`. |
| `polish_unavailable` | Ollama offline; backend usa `text_raw` no `final`. |
| `session_not_started` | Cliente mandou `audio_chunk` antes de `session_start`. |
| `config_invalid` | `set_config` recebeu payload mal formado (não dict). |

---

## 3. Versionamento

- `protocol_version` é número inteiro monotônico. MVP = `1`.
- Backend rejeita conexão se cliente enviar versão maior que a suportada (`error.code = "protocol_version_mismatch"` no handshake).
- Mudanças retrocompatíveis (adicionar campo opcional) NÃO mudam a versão.
- Mudanças quebrantes (renomear, remover, mudar tipo) bumpam a versão e ficam registradas aqui em `## Changelog`.

## Changelog

- **v1** (Fase 0) — protocolo inicial: `ping`/`pong`. Demais tipos definidos mas implementados em fases posteriores.
