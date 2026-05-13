# ADR 0005 — Hotkey de gravação `F8`, settings em `Ctrl+Alt+S`

**Status:** Aceito — supera [ADR 0002](0002-hotkey-ctrl-shift-r.md)
**Data:** 2026-05-13

## Contexto

[ADR 0002](0002-hotkey-ctrl-shift-r.md) escolheu `Ctrl+Shift+R` pra gravar.
Na Fase 9, tentamos adicionar atalho de Settings:

1. `Ctrl+Shift+,` (vírgula) — falhou no Windows com teclado ABNT (mapping
   de pontuação inconsistente no `tauri-plugin-global-shortcut`).
2. `Ctrl+Shift+'` (apóstrofo / `Quote`) — mesma falha.
3. `Ctrl+Alt+S` — **funcionou**. Alt + letra atravessa qualquer layout.

Em seguida tentamos padronizar a gravação também como `Ctrl+Alt+<letra>`:

1. `Ctrl+Alt+R` — `HotKey already registered`: **NVIDIA App** (GeForce Experience)
   sequestra vários `Ctrl+Alt+<letra>` globalmente.
2. `Ctrl+Alt+Space` — `HotKey already registered`: provavelmente
   IME do Windows ou interpretação como AltGr+Space (non-breaking space)
   no layout ABNT.

Diante de dois conflitos seguidos com `Ctrl+Alt+*` na máquina-alvo,
escolhemos uma tecla sem modificadores que tem zero conflito conhecido:
**F8**.

## Decisão

- **Gravar (PTT/Toggle): `F8`** — tecla única, sem modificador.
- **Abrir Settings: `Ctrl+Alt+S`** — segue um padrão; mas como há só
  um atalho com modifier hoje, a "convenção" é menos rígida do que pensamos.

## Consequências

**Positivas**
- `F8` é zero-conflito no Windows (alguns DAWs/games usam F-keys, aceitável risco).
- Ergonomia top pra hold-to-talk longo: uma tecla, um dedo.
- Detecção robusta — F-keys têm scancodes universais, sem dor de layout.

**Negativas**
- Não há "padrão coeso" entre os dois atalhos. Aceito — o conflito da NVIDIA
  forçou o pragmatismo. Quando a Fase 9.5+ deixar o usuário escolher a hotkey
  via UI livre, isso é mitigado.
- F8 pode ter conflito em DAW (Reaper, Ableton) ou em jogos com hotkeys
  customizadas. Documentar como gotcha conhecido.

## Pegadinhas resolvidas no caminho

- **NVIDIA App rouba `Ctrl+Alt+<letra>`**: descoberta importante. Qualquer
  atalho com Alt+letra precisa ser testado nessa máquina.
- **Windows + IME + AltGr no ABNT**: `Ctrl+Alt+Space` colide com sistema.
- **Path do config.json**: Rust roda com CWD em `src-tauri/` durante
  `cargo tauri dev`. Implementamos `locate_config_path()` que tenta CWD
  + `../`, e `dev.ps1` agora seta `JARVSTRANSCRIPT_CONFIG_PATH` explícito.

## Migração

- `hotkey.rs::DEFAULT_HOTKEY` → `"F8"`
- `settings/config.py::Settings.hotkey` default → `"F8"`
- `data/config.json` atualizado
- Cargo tests: `default_hotkey_e_f8_puro` + `settings_hotkey_segue_convencao_ctrl_alt`
- README + Pill text + ADR 0002 marcado superseded
