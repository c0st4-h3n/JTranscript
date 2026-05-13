"""Limpeza do cache HuggingFace pra manter só o modelo Whisper em uso.

Decisão UX (Henrique): trocar de modelo deve descartar o anterior do disco.
Modelos Whisper ocupam 75MB-3GB cada — sem cleanup, ficam acumulando.

Implementação: lista o cache via `huggingface_hub.scan_cache_dir()`, identifica
repos que pareçam Whisper (substring 'whisper' no repo_id), e remove tudo
exceto o que casa com o `keep_model` atual (comparação por substring no nome
curto, suficiente pra cobrir variações como `Systran/faster-whisper-base`).

Falhas no cleanup são best-effort — log e segue. Cleanup nunca derruba o backend.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from jarvstranscript.ipc import log_stream

if TYPE_CHECKING:
    from huggingface_hub import CachedRepoInfo, HFCacheInfo


@dataclass(frozen=True, slots=True)
class CleanupResult:
    removed_repos: list[str]
    freed_bytes: int
    errors: list[str]


def cleanup_except(keep_model: str) -> CleanupResult:
    """Remove modelos Whisper do cache HF, exceto o que casa com `keep_model`.

    Match por substring no nome curto do repo. Funciona pra:
    - 'base' → mantém 'Systran/faster-whisper-base', remove os outros
    - 'large-v3-turbo' → mantém 'deepdml/faster-whisper-large-v3-turbo-ct2'
    - 'org/custom-whisper' → mantém esse, remove os outros
    """
    try:
        from huggingface_hub import scan_cache_dir
    except ImportError:
        return CleanupResult(
            removed_repos=[],
            freed_bytes=0,
            errors=["huggingface_hub nao disponivel"],
        )

    try:
        cache = scan_cache_dir()
    except Exception as e:  # noqa: BLE001
        return CleanupResult(removed_repos=[], freed_bytes=0, errors=[f"scan falhou: {e}"])

    return _cleanup_from_cache(cache, keep_model)


def _cleanup_from_cache(cache: "HFCacheInfo", keep_model: str) -> CleanupResult:
    """Lógica testável — recebe `HFCacheInfo` já carregado."""
    keep_short = _short_name(keep_model)
    removed: list[str] = []
    freed = 0
    errors: list[str] = []

    for repo in cache.repos:
        if not _is_whisper_repo(repo.repo_id):
            continue
        if _matches_keep(repo.repo_id, keep_short):
            continue
        revisions = [r.commit_hash for r in repo.revisions]
        if not revisions:
            continue
        try:
            cache.delete_revisions(*revisions).execute()
            removed.append(repo.repo_id)
            freed += getattr(repo, "size_on_disk", 0) or 0
        except Exception as e:  # noqa: BLE001
            errors.append(f"{repo.repo_id}: {e}")

    if removed or errors:
        log_stream.emit(
            "model_cache.cleanup",
            "limpeza cache hf",
            kept=keep_short,
            removed=len(removed),
            freed_mb=round(freed / 1024 / 1024, 1),
            errors=len(errors),
        )

    return CleanupResult(removed_repos=removed, freed_bytes=freed, errors=errors)


def _short_name(model: str) -> str:
    """`'Systran/faster-whisper-base' → 'faster-whisper-base'` ou `'base' → 'base'`."""
    return model.split("/")[-1].lower()


def _is_whisper_repo(repo_id: str) -> bool:
    return "whisper" in repo_id.lower()


def _matches_keep(repo_id: str, keep_short: str) -> bool:
    """Match conservador: ambas substrings do nome curto se encontram.

    Cobre os casos:
    - keep='base', repo='Systran/faster-whisper-base' → match
    - keep='base', repo='Systran/faster-whisper-base.en' → match (variante en)
    - keep='large-v3-turbo', repo='deepdml/faster-whisper-large-v3-turbo-ct2' → match
    - keep='tiny', repo='Systran/faster-whisper-medium' → NÃO match
    """
    repo_short = _short_name(repo_id)
    return keep_short in repo_short or repo_short in keep_short
