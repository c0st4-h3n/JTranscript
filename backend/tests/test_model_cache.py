"""Testes do `voice.model_cache._cleanup_from_cache` — lógica pura sobre HFCacheInfo fake."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from jarvstranscript.voice.model_cache import (
    _cleanup_from_cache,
    _is_whisper_repo,
    _matches_keep,
    _short_name,
)


@dataclass
class FakeRevision:
    commit_hash: str


@dataclass
class FakeRepo:
    repo_id: str
    revisions: list[FakeRevision]
    size_on_disk: int = 0


@dataclass
class FakeDeleteStrategy:
    parent: "FakeCacheInfo"
    hashes: tuple[str, ...]

    def execute(self) -> None:
        for r in list(self.parent.repos):
            if any(rev.commit_hash in self.hashes for rev in r.revisions):
                self.parent.repos.remove(r)
                self.parent.deleted.append(r.repo_id)


@dataclass
class FakeCacheInfo:
    repos: list[FakeRepo]
    deleted: list[str] = field(default_factory=list)

    def delete_revisions(self, *hashes: str) -> FakeDeleteStrategy:
        return FakeDeleteStrategy(parent=self, hashes=hashes)


class TestShortName:
    def test_extrai_nome_apos_barra(self) -> None:
        assert _short_name("Systran/faster-whisper-base") == "faster-whisper-base"

    def test_sem_barra_retorna_lowercase(self) -> None:
        assert _short_name("BASE") == "base"


class TestIsWhisperRepo:
    def test_systran_faster_whisper(self) -> None:
        assert _is_whisper_repo("Systran/faster-whisper-base") is True

    def test_distil_whisper(self) -> None:
        assert _is_whisper_repo("Systran/faster-distil-whisper-large-v3") is True

    def test_repo_aleatorio_falso(self) -> None:
        assert _is_whisper_repo("meta-llama/Llama-3-8B") is False


class TestMatchesKeep:
    def test_base_no_repo_base(self) -> None:
        assert _matches_keep("Systran/faster-whisper-base", "base") is True

    def test_base_no_repo_medium(self) -> None:
        assert _matches_keep("Systran/faster-whisper-medium", "base") is False

    def test_large_v3_turbo_repo_deepdml(self) -> None:
        assert (
            _matches_keep(
                "deepdml/faster-whisper-large-v3-turbo-ct2",
                "large-v3-turbo",
            )
            is True
        )


class TestCleanupFromCache:
    def test_remove_apenas_modelos_whisper_que_nao_casam(self) -> None:
        cache = FakeCacheInfo(
            repos=[
                FakeRepo("Systran/faster-whisper-tiny", [FakeRevision("h1")], 75_000_000),
                FakeRepo("Systran/faster-whisper-base", [FakeRevision("h2")], 150_000_000),
                FakeRepo("Systran/faster-whisper-medium", [FakeRevision("h3")], 1_500_000_000),
                FakeRepo("meta-llama/Llama-3", [FakeRevision("h4")], 8_000_000_000),
            ]
        )
        result = _cleanup_from_cache(cache, "base")

        # Removeu tiny e medium; manteve base (atual) e Llama (não-whisper)
        assert set(result.removed_repos) == {
            "Systran/faster-whisper-tiny",
            "Systran/faster-whisper-medium",
        }
        assert result.freed_bytes == 75_000_000 + 1_500_000_000
        assert result.errors == []
        remaining_ids = {r.repo_id for r in cache.repos}
        assert "Systran/faster-whisper-base" in remaining_ids
        assert "meta-llama/Llama-3" in remaining_ids

    def test_keep_match_por_repo_id_custom(self) -> None:
        cache = FakeCacheInfo(
            repos=[
                FakeRepo("Systran/faster-whisper-tiny", [FakeRevision("h1")]),
                FakeRepo(
                    "deepdml/faster-whisper-large-v3-turbo-ct2",
                    [FakeRevision("h2")],
                ),
            ]
        )
        result = _cleanup_from_cache(cache, "large-v3-turbo")
        assert result.removed_repos == ["Systran/faster-whisper-tiny"]

    def test_cache_vazio_devolve_lista_vazia(self) -> None:
        cache = FakeCacheInfo(repos=[])
        result = _cleanup_from_cache(cache, "base")
        assert result.removed_repos == []
        assert result.freed_bytes == 0
        assert result.errors == []

    def test_repo_sem_revisao_e_ignorado(self) -> None:
        cache = FakeCacheInfo(
            repos=[
                FakeRepo("Systran/faster-whisper-tiny", []),  # sem revisões
            ]
        )
        result = _cleanup_from_cache(cache, "base")
        assert result.removed_repos == []

    def test_falha_na_delete_e_capturada_como_error(self) -> None:
        class BrokenCache(FakeCacheInfo):
            def delete_revisions(self, *hashes: str) -> Any:
                class _Strat:
                    def execute(self_inner) -> None:
                        raise RuntimeError("disco cheio")
                return _Strat()

        cache = BrokenCache(
            repos=[FakeRepo("Systran/faster-whisper-tiny", [FakeRevision("h1")])]
        )
        result = _cleanup_from_cache(cache, "base")
        assert result.removed_repos == []
        assert len(result.errors) == 1
        assert "disco cheio" in result.errors[0]
