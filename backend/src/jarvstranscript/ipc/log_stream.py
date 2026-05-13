"""Log stream JSONL — Fase 0 traz só a interface mínima.

Regras (de `feedback_logs_style.md` aplicadas):
- Sem print() em produção; só log_stream.emit().
- PT-BR curto e factual ("colado", não "operação de colagem concluída").
- Latências/contagens como campos numéricos.
- Linhas msg ≤120 chars.
- Sem emoji.

Implementação rotativa em arquivo + streaming pra cockpit entra na Fase 10.
"""

from __future__ import annotations

import sys
from typing import Any

import structlog


def configure(level: str = "INFO") -> None:
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=False),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            {"DEBUG": 10, "INFO": 20, "WARNING": 30, "ERROR": 40}[level]
        ),
        logger_factory=structlog.PrintLoggerFactory(file=sys.stderr),
        cache_logger_on_first_use=True,
    )


def emit(category: str, msg: str, **fields: Any) -> None:
    """Emite uma linha de log estruturado.

    `category` é a chave de filtragem do cockpit (ex: 'session.start', 'stt.partial').
    `msg` é texto curto factual em PT-BR (≤120 chars).
    """
    if len(msg) > 120:
        msg = msg[:117] + "..."
    structlog.get_logger().info(msg, category=category, **fields)
