"""Testes do `jarvstranscript.settings.config` — load/save/merge + path resolution."""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

from jarvstranscript.settings.config import (
    CONFIG_VERSION,
    DEFAULT_CONFIG_PATH_ENV,
    Settings,
    load_settings,
    resolve_config_path,
    save_settings,
)


class TestSettingsDefaults:
    def test_defaults_tem_campos_esperados(self) -> None:
        s = Settings.defaults()
        assert s.version == CONFIG_VERSION
        assert s.model == "tiny"
        assert s.device == "auto"
        assert s.mode == "ptt"
        assert s.vad == "silero"
        assert s.silence_to_end_ms == 3000
        assert s.language == "pt"
        assert "mintty.exe" in s.blocklist_apps

    def test_to_dict_e_from_dict_round_trip(self) -> None:
        s = Settings(model="large-v3-turbo", mode="toggle")
        round_trip = Settings.from_dict(s.to_dict())
        assert round_trip == s

    def test_merge_nao_muta_original(self) -> None:
        s = Settings.defaults()
        s2 = s.merge(model="large-v3-turbo")
        assert s.model == "tiny", "original mudou"
        assert s2.model == "large-v3-turbo"

    def test_from_dict_ignora_chaves_desconhecidas(self) -> None:
        # Campo extra que pode vir de versão futura: backend tolera.
        s = Settings.from_dict({"model": "tiny", "campo_futuro": "ignorado"})
        assert s.model == "tiny"


class TestResolveConfigPath:
    def test_argumento_explicito_tem_prioridade(self, tmp_path: Path) -> None:
        explicit = tmp_path / "alt.json"
        assert resolve_config_path(explicit) == explicit

    def test_env_var_quando_sem_explicito(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        env_path = tmp_path / "via_env.json"
        monkeypatch.setenv(DEFAULT_CONFIG_PATH_ENV, str(env_path))
        assert resolve_config_path() == env_path

    def test_default_e_cwd_data_config_json(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
    ) -> None:
        monkeypatch.delenv(DEFAULT_CONFIG_PATH_ENV, raising=False)
        monkeypatch.chdir(tmp_path)
        assert resolve_config_path() == tmp_path / "data" / "config.json"


class TestLoadSave:
    def test_load_sem_arquivo_devolve_defaults(self, tmp_path: Path) -> None:
        s = load_settings(tmp_path / "nope.json")
        assert s == Settings.defaults()

    def test_load_arquivo_corrompido_devolve_defaults(self, tmp_path: Path) -> None:
        bad = tmp_path / "broken.json"
        bad.write_text("nao e json {{{")
        assert load_settings(bad) == Settings.defaults()

    def test_load_arquivo_nao_dict_devolve_defaults(self, tmp_path: Path) -> None:
        arr = tmp_path / "array.json"
        arr.write_text("[1, 2, 3]")
        assert load_settings(arr) == Settings.defaults()

    def test_save_grava_json_legivel(self, tmp_path: Path) -> None:
        target = tmp_path / "out" / "config.json"
        s = Settings(model="large-v3-turbo", mode="toggle")
        saved_path = save_settings(s, target)
        assert saved_path == target
        assert target.exists()
        data = json.loads(target.read_text(encoding="utf-8"))
        assert data["model"] == "large-v3-turbo"
        assert data["mode"] == "toggle"

    def test_save_cria_diretorios(self, tmp_path: Path) -> None:
        target = tmp_path / "a" / "b" / "c" / "config.json"
        save_settings(Settings.defaults(), target)
        assert target.exists()

    def test_round_trip_disco(self, tmp_path: Path) -> None:
        target = tmp_path / "config.json"
        original = Settings(
            model="large-v3-turbo",
            device="cuda",
            mode="toggle",
            silence_to_end_ms=2000,
        )
        save_settings(original, target)
        loaded = load_settings(target)
        assert loaded == original

    def test_save_e_atomico_via_rename(self, tmp_path: Path) -> None:
        target = tmp_path / "config.json"
        target.write_text(json.dumps({"version": 1, "model": "old"}))
        save_settings(Settings(model="new"), target)
        # Nenhum .tmp deve sobrar
        leftovers = list(tmp_path.glob("*.tmp"))
        assert leftovers == []
        loaded = load_settings(target)
        assert loaded.model == "new"


class TestMigration:
    def test_versao_invalida_volta_pro_default(self) -> None:
        s = Settings.from_dict({"version": -1, "model": "tiny"})
        assert s.version == CONFIG_VERSION

    def test_sem_version_recebe_default(self) -> None:
        s = Settings.from_dict({"model": "tiny"})
        assert s.version == CONFIG_VERSION
