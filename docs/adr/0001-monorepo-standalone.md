# ADR 0001 — JarvsTranscript como monorepo standalone

**Status:** Aceito
**Data:** 2026-05-11

## Contexto

O JarvsTranscript poderia viver dentro do repo do Jarvinho (reusando libs de áudio, log streaming, GPU bootstrap) ou como projeto separado.

## Decisão

Repo novo, standalone. Sem dependência do Jarvinho rodando nem do código dele em runtime.

## Consequências

**Positivas**
- Distribuição limpa: `JarvsTranscript.msi` instala sozinho, sem precisar do Jarvinho.
- Ciclo de release independente; um bug no Jarvinho não trava feature daqui.
- Threat model menor: superfície de ataque do app é só o próprio binário.
- TCC code review e ADRs ficam focados num produto só.

**Negativas**
- Duplicação inevitável de utilitários: DNS override pra HuggingFace, GPU bootstrap (cublas/cudnn wheels), log streaming JSONL. Aceitamos a duplicação como custo de independência. Se virar dor, extraímos uma `jarvs-toolkit` lib publicada localmente.
- Sem reuso direto do hot-reload e cockpit do Jarvinho. JarvsTranscript ganha cockpit mini próprio na Fase 10.

## Alternativas consideradas

- **Submódulo do Jarvinho:** rejeitado. Acoplamento demais; mudanças no Jarvinho podem quebrar build daqui.
- **Pacote Python publicado no Jarvinho:** rejeitado. Versionamento cruzado vira pesadelo; um app desktop não deve depender de outro app desktop estar instalado.
