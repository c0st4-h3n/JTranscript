"""Orquestra mudanças de config: persiste no disco + aplica hot-reload no STT.

Mantém `Settings` como source-of-truth in-memory. Mudanças vão via `apply()`
que (a) grava no disco atômicamente, (b) dispara reload do `STTContainer` se
`model` ou `device` mudaram, (c) retorna snapshot pro caller.
"""

from __future__ import annotations

from dataclasses import asdict
from pathlib import Path
from typing import Any

from jarvstranscript.adapters.stt_container import ReloadResult, STTContainer
from jarvstranscript.settings.config import Settings, save_settings


HOT_RELOADABLE_KEYS = {"model", "device"}


class ConfigManager:
    """Estado mutável: settings atual + STTContainer. Sincroniza no `apply`."""

    def __init__(
        self,
        settings: Settings,
        stt_container: STTContainer,
        path: Path | str | None = None,
    ) -> None:
        self._settings = settings
        self._stt = stt_container
        self._path = path

    @property
    def settings(self) -> Settings:
        return self._settings

    @property
    def stt_container(self) -> STTContainer:
        return self._stt

    async def apply(self, patch: dict[str, Any]) -> dict[str, Any]:
        """Mescla `patch` no settings atual, persiste, e recarrega STT se preciso.

        Retorna um dict com `settings` (snapshot novo) e `reload` (None se não
        houve reload, ou `ReloadResult` dict caso contrário).
        """
        if not isinstance(patch, dict):
            raise ValueError("patch deve ser dict")

        # Filtra chaves desconhecidas — quem manda algo solto não corrompe.
        valid_keys = {f.name for f in _settings_fields()}
        clean = {k: v for k, v in patch.items() if k in valid_keys}

        new_settings = self._settings.merge(**clean)
        save_settings(new_settings, self._path)

        reload_result: ReloadResult | None = None
        needs_reload = any(
            k in HOT_RELOADABLE_KEYS and self._settings.__dict__[k] != new_settings.__dict__[k]
            for k in clean
        )
        if needs_reload:
            reload_result = await self._stt.reload(new_settings.model, new_settings.device)

        # Só atualiza in-memory APÓS save + reload bem-sucedidos.
        # Se reload falhou, mantemos settings antigo NO DISCO seria inconsistente —
        # então gravamos de qualquer jeito (disco reflete intenção do usuário) mas
        # informamos o erro pro caller decidir.
        self._settings = new_settings

        return {
            "settings": new_settings.to_dict(),
            "reload": asdict(reload_result) if reload_result is not None else None,
        }


def _settings_fields() -> Any:
    from dataclasses import fields
    return fields(Settings)
