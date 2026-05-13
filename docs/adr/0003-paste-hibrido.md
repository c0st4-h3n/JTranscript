# ADR 0003 — Inserção de texto híbrida (clipboard + SendInput fallback)

**Status:** Aceito
**Data:** 2026-05-11

## Contexto

Como entregar o texto transcrito no app que o usuário tinha em foco?

| Estratégia | Prós | Contras |
|---|---|---|
| Clipboard + `Ctrl+V` (arboard + enigo) | Rapidíssimo; suporta unicode perfeito; uma chamada só | Race com outras apps mexendo no clipboard; em apps "refratárias" (mintty, alguns terminais Linux-like no Windows) o paste falha silenciosamente |
| SendInput keystroke-por-keystroke (enigo) | Funciona em quase qualquer app, inclusive os refratários | Lento (~50 keystrokes/seg); risco de auto-replace/auto-complete corromper o texto; emoji/composição complexa pode falhar |

## Decisão

Híbrido:
- **Default:** clipboard paste — `arboard.save_current()` → `set(text)` → `enigo.Ctrl+V` → `restore()` após 200ms.
- **Fallback automático:** se paste falhar (clipboard owner mudou, app não respondeu ao Ctrl+V), cai pra `enigo.text(text)` keystroke-por-keystroke.
- **Blocklist configurável:** apps conhecidos como refratários (`mintty.exe`, `wsl.exe`) pulam direto pro SendInput.

## Consequências

**Positivas**
- 95% dos casos pega clipboard (rápido, unicode-perfeito).
- Apps difíceis ainda funcionam, sem o usuário precisar saber por quê.
- Audit log distingue `insert.paste` vs `insert.fallback` pra calibrar a blocklist.

**Negativas**
- Mutex em torno do clipboard precisa ser cuidadoso pra não bloquear se uma app travar segurando o clipboard.
- Restore do clipboard tem race window de 200ms — se o usuário copiar algo nesse intervalo, perde. Documentar no README.
