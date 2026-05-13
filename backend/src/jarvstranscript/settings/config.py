"""Config persistido em `data/config.json` — fonte de verdade compartilhada
entre backend Python e shell Rust.

Schema versionado. Quando bumar, escrever migração em `_migrate()`.

Hot-reloadable na Fase 9: `model`, `device`. Demais campos hoje exigem restart;
mover pra hot quando virar dor.
"""

from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass, field, fields
from pathlib import Path
from typing import Any

CONFIG_VERSION = 1
DEFAULT_CONFIG_PATH_ENV = "JARVSTRANSCRIPT_CONFIG_PATH"


@dataclass
class Settings:
    """Snapshot do config. Imutável após `load`; pra mudar, reload do disco."""

    version: int = CONFIG_VERSION
    model: str = "tiny"
    device: str = "auto"  # auto | cuda | cpu
    language: str = "pt"
    mode: str = "ptt"  # ptt | toggle
    vad: str = "silero"  # silero | rms | off
    silence_to_end_ms: int = 3000
    polish_enabled: bool = False  # Fase 8 ainda não implementada
    hotkey: str = "F8"
    blocklist_apps: list[str] = field(default_factory=lambda: ["mintty.exe", "wsl.exe"])

    @classmethod
    def defaults(cls) -> "Settings":
        return cls()

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Settings":
        migrated = _migrate(data)
        known = {f.name for f in fields(cls)}
        filtered = {k: v for k, v in migrated.items() if k in known}
        return cls(**filtered)

    def merge(self, **overrides: Any) -> "Settings":
        """Retorna nova Settings com campos sobrescritos. Não muta o original."""
        data = self.to_dict()
        data.update(overrides)
        return Settings.from_dict(data)


def resolve_config_path(explicit: Path | str | None = None) -> Path:
    """Resolve o caminho do config.json com a seguinte precedência:

    1. Argumento explícito (testes)
    2. Env `JARVSTRANSCRIPT_CONFIG_PATH`
    3. `{cwd}/data/config.json`
    """
    if explicit is not None:
        return Path(explicit)
    env_value = os.environ.get(DEFAULT_CONFIG_PATH_ENV)
    if env_value:
        return Path(env_value)
    return Path.cwd() / "data" / "config.json"


def load_settings(path: Path | str | None = None) -> Settings:
    """Carrega do disco. Se o arquivo não existir, retorna defaults sem gravar."""
    resolved = resolve_config_path(path)
    if not resolved.exists():
        return Settings.defaults()
    try:
        raw = json.loads(resolved.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        # Arquivo corrompido — não derruba o backend, volta pro default e
        # deixa o write seguinte sobrescrever.
        return Settings.defaults()
    if not isinstance(raw, dict):
        return Settings.defaults()
    return Settings.from_dict(raw)


def save_settings(settings: Settings, path: Path | str | None = None) -> Path:
    """Grava no disco (cria diretório se preciso). Retorna o path final escrito."""
    resolved = resolve_config_path(path)
    resolved.parent.mkdir(parents=True, exist_ok=True)
    tmp = resolved.with_suffix(resolved.suffix + ".tmp")
    tmp.write_text(json.dumps(settings.to_dict(), indent=2, ensure_ascii=False), encoding="utf-8")
    # rename é atômico no mesmo filesystem — evita config corrompido se crashar no meio
    tmp.replace(resolved)
    return resolved


def _migrate(data: dict[str, Any]) -> dict[str, Any]:
    """Migrações de schema. Hoje só v1 → mantém igual."""
    version = data.get("version", CONFIG_VERSION)
    if not isinstance(version, int) or version < 1:
        version = CONFIG_VERSION
    data["version"] = version
    return data
