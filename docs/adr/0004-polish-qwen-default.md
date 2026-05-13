# ADR 0004 — Polish do texto via Qwen 2.5 7B local, ligado por padrão

**Status:** Aceito
**Data:** 2026-05-11

## Contexto

`faster-whisper large-v3-turbo` em PT-BR já é bom, mas tem padrões chatos: filler words ("ééé", "tipo"), falta de pontuação consistente, capitalização errática. Reaproveitamos o Qwen 2.5 7B Instruct que já roda local pelo Ollama (Jarvinho instalado ou instalável separado).

## Decisão

- **Polish ligado por padrão**, com prompt PT-BR endurecido (remove fillers, normaliza pontuação/capitalização, preserva nomes próprios e termos técnicos sem traduzir).
- **Toggle visível na pill** pra desligar com um clique (latência cai ~500-800ms).
- **Fallback regex** se Ollama estiver offline ou timeout (3s). Aplica só o trivial: trim, primeira maiúscula, ponto final se faltar.
- **PolishPort** abstrai tudo — trocar Qwen por outro LLM amanhã não toca o `core`.

## Consequências

**Positivas**
- Qualidade do texto final salta visivelmente em PT-BR.
- Modelo já existe no disco se o Jarvinho está instalado (zero custo de download).
- `chars_in`/`chars_out`/`latency_ms` em log permitem calibrar o prompt depois.

**Negativas**
- Latência adicional 300-800ms pra textos curtos, até 1.5s pra parágrafos. Aceitamos: o usuário pode desligar.
- Dependência do Ollama rodando (porta 11434). Detectar offline e cair pro regex.
- VRAM compartilhada com Whisper. Em GPUs menores (≤8GB) pode haver swap; documentar fallback CPU.

## Revisitar quando

- Se a latência média do polish ultrapassar 1.5s consistentemente, considerar quantização mais agressiva (q3) ou substituir por modelo menor (qwen2.5:3b).
