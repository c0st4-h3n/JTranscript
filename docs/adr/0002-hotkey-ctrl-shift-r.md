# ADR 0002 — Hotkey global Ctrl+Shift+R

**Status:** Superseded por [ADR 0005](0005-hotkey-pattern-ctrl-alt.md) — padrão atual é `Ctrl+Alt+<letra>`
**Data:** 2026-05-11

## Contexto

Precisa de uma hotkey global única que dispare/encerre dictation. Alternativas pesadas:

| Combo | Conflito conhecido | Ergonomia |
|---|---|---|
| `Ctrl+Shift+R` | Chrome (hard refresh), VSCode (replace) | Boa, três dedos esquerda |
| `Ctrl+Shift+Space` | Raro | Boa, dois dedos |
| `Alt+\`` | Quase nenhum | Uma mão; layout-dependente |
| `F8` puro | Alguns DAWs / debuggers | Excelente |

## Decisão

`Ctrl+Shift+R`, configurável em settings desde o dia 1.

## Consequências

**Positivas**
- Mnemônico forte ("R" de record).
- Fácil de segurar pra hold-to-talk.

**Negativas**
- Em Chrome e VSCode em foco, hotkey é consumida pelo app antes do shell global em alguns casos. Workaround: ditar com foco em outro app (a pill flutuante já guia).
- Settings precisa permitir trocar a hotkey sem reiniciar (entra na Fase 9).

## Revisitar quando

- Se relatório de bugs da Fase 11 mostrar que >20% das tentativas de ditado em VSCode/Chrome falham por conflito, troca pra `Ctrl+Shift+Space` como nova default (com migração suave do settings).
