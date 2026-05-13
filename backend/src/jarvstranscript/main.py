"""Entrypoint do backend.

Carrega Settings (`data/config.json` ou env `JARVSTRANSCRIPT_CONFIG_PATH`),
constrói STTContainer (envolve WhisperAdapter, suporta hot reload) + VAD,
sobe WS server em 127.0.0.1:7979.

Envs override (precedência sobre config.json):
- `JARVSTRANSCRIPT_MODEL`     — checkpoint Whisper
- `JARVSTRANSCRIPT_DEVICE`    — 'cuda', 'cpu' ou 'auto'
- `JARVSTRANSCRIPT_VAD`       — 'silero', 'rms', 'off'
- `JARVSTRANSCRIPT_MODE`      — 'ptt' ou 'toggle' (decisão do shell Rust)
- `JARVSTRANSCRIPT_CONFIG_PATH` — caminho do config.json
"""

from __future__ import annotations

import asyncio
import os

from jarvstranscript.adapters.stt_container import STTContainer, spawn_hf_cleanup
from jarvstranscript.adapters.stt_whisper import WhisperAdapter
from jarvstranscript.core.ports import VADPort
from jarvstranscript.ipc import log_stream
from jarvstranscript.ipc.ws_server import run as run_ws
from jarvstranscript.settings.config import Settings, load_settings, save_settings
from jarvstranscript.settings.manager import ConfigManager
from jarvstranscript.voice.vad import RmsVAD


def _whisper_factory(model: str, device: str) -> WhisperAdapter:
    return WhisperAdapter(model_name=model, device=device, language="pt")


def _load_vad(setting: str) -> VADPort | None:
    if setting == "off":
        return None
    if setting == "rms":
        log_stream.emit("vad.load", "vad rms ativo (heuristica)")
        return RmsVAD()
    # default silero, com fallback RMS se falhar
    try:
        from jarvstranscript.voice.vad import SileroVAD

        vad = SileroVAD()
        log_stream.emit("vad.load", "silero-vad carregado")
        return vad
    except Exception as e:  # noqa: BLE001
        log_stream.emit(
            "vad.load",
            "silero falhou — fallback rms",
            error=str(e)[:120],
        )
        return RmsVAD()


def _merge_env_overrides(settings: Settings) -> Settings:
    """Env vars sobrescrevem settings (config.json) — usado por scripts de dev."""
    overrides: dict[str, str] = {}
    if "JARVSTRANSCRIPT_MODEL" in os.environ:
        overrides["model"] = os.environ["JARVSTRANSCRIPT_MODEL"]
    if "JARVSTRANSCRIPT_DEVICE" in os.environ:
        overrides["device"] = os.environ["JARVSTRANSCRIPT_DEVICE"]
    if "JARVSTRANSCRIPT_VAD" in os.environ:
        overrides["vad"] = os.environ["JARVSTRANSCRIPT_VAD"]
    if "JARVSTRANSCRIPT_MODE" in os.environ:
        overrides["mode"] = os.environ["JARVSTRANSCRIPT_MODE"]
    if not overrides:
        return settings
    return settings.merge(**overrides)


async def _async_main() -> None:
    raw_settings = load_settings()
    settings = _merge_env_overrides(raw_settings)
    # Se houve override por env, NÃO sobrescreve o disco — o disco é a fonte
    # de verdade controlada pelo usuário.

    # Se o arquivo não existia, grava defaults agora pra deixar visível.
    if raw_settings == Settings.defaults():
        try:
            save_settings(settings)
        except OSError:
            pass

    log_stream.emit(
        "backend.boot",
        "subindo backend",
        model=settings.model,
        device=settings.device,
        vad=settings.vad,
    )
    stt_container = STTContainer(
        _whisper_factory,
        settings.model,
        settings.device,
        on_reload_success=spawn_hf_cleanup,
    )
    vad = _load_vad(settings.vad)
    config_mgr = ConfigManager(settings, stt_container)
    try:
        await run_ws(config_mgr, vad=vad)
    finally:
        stt_container.close()


def run() -> None:
    log_stream.configure()
    try:
        asyncio.run(_async_main())
    except KeyboardInterrupt:
        log_stream.emit("backend.shutdown", "ctrl-c — encerrando")


if __name__ == "__main__":
    run()
