"""`STTContainer` — wrapper hot-reloadable em torno de qualquer `STTPort`.

Permite trocar o engine STT (Whisper tiny → large-v3-turbo) sem reiniciar o
backend. Mantém um lock interno; transcrições e reload são mutuamente
exclusivos pra evitar racing no modelo.

Factory é injetável — `main.py` passa um factory que constrói `WhisperAdapter`
real. Testes injetam factory que cria fakes (sem GPU, sem download).
"""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from dataclasses import dataclass

from jarvstranscript.core.ports import AudioBuffer, STTPort, TranscriptionFinal

# (model_name, device) -> STTPort
STTFactory = Callable[[str, str], STTPort]
# Callback opcional chamado APÓS um reload de sucesso, recebendo o novo
# `model_name`. Usado pra disparar cleanup do cache HF. None = sem callback,
# que é o default em testes (testes não devem mexer no cache real do disco).
OnReloadSuccess = Callable[[str], None]


@dataclass(frozen=True, slots=True)
class ReloadResult:
    changed: bool
    model: str
    device: str
    error: str | None = None


class STTContainer:
    """Envolve um `STTPort` corrente. Implementa `STTPort` por delegação.

    `on_reload_success` é callback opcional disparado após swap de adapter.
    `main.py` injeta cleanup do cache HF aqui; testes deixam `None` pra evitar
    efeitos colaterais no disco do dev.
    """

    def __init__(
        self,
        factory: STTFactory,
        model_name: str,
        device: str = "auto",
        on_reload_success: OnReloadSuccess | None = None,
    ) -> None:
        self._factory = factory
        self._adapter: STTPort = factory(model_name, device)
        self._current_model = model_name
        self._lock = asyncio.Lock()
        self._on_reload_success = on_reload_success

    @property
    def device(self) -> str:
        return self._adapter.device

    @property
    def current_model(self) -> str:
        return self._current_model

    async def transcribe_final(self, audio: AudioBuffer) -> TranscriptionFinal:
        async with self._lock:
            return await self._adapter.transcribe_final(audio)

    async def reload(self, model_name: str, device: str = "auto") -> ReloadResult:
        """Troca o adapter por um novo construído via factory.

        - Mesmo `model_name` + `device` atual → no-op (`changed=False`).
        - Factory falha → mantém adapter atual + retorna `error` preenchido.
        - Sucesso → swap, fecha o velho, atualiza `current_model`, dispara
          cleanup do cache HF em background (best-effort).
        """
        async with self._lock:
            if model_name == self._current_model and device == self._adapter.device:
                return ReloadResult(
                    changed=False,
                    model=self._current_model,
                    device=self._adapter.device,
                )
            old = self._adapter
            try:
                # `to_thread` pra não bloquear o event loop durante load do modelo
                # (faster-whisper inicialização pode levar 1-30s).
                new = await asyncio.to_thread(self._factory, model_name, device)
            except Exception as e:  # noqa: BLE001 — qualquer falha mantém o velho
                return ReloadResult(
                    changed=False,
                    model=self._current_model,
                    device=old.device,
                    error=str(e),
                )
            self._adapter = new
            self._current_model = model_name
            _close_if_possible(old)
            if self._on_reload_success is not None:
                try:
                    self._on_reload_success(model_name)
                except Exception:  # noqa: BLE001 — callback nunca derruba o reload
                    pass
            return ReloadResult(changed=True, model=self._current_model, device=new.device)

    def close(self) -> None:
        _close_if_possible(self._adapter)


def _close_if_possible(adapter: object) -> None:
    close = getattr(adapter, "close", None)
    if callable(close):
        close()


def spawn_hf_cleanup(keep_model: str) -> None:
    """Dispara cleanup do cache HF em thread separada — best effort, sem bloquear.

    Pública pra `main.py` injetar como `on_reload_success` no STTContainer.
    NÃO chame de testes (mexe no `~/.cache/huggingface` real).
    """
    import threading

    def _run() -> None:
        try:
            from jarvstranscript.voice.model_cache import cleanup_except

            cleanup_except(keep_model)
        except Exception:  # noqa: BLE001 — cleanup nunca derruba o backend
            pass

    threading.Thread(target=_run, daemon=True, name="hf-cache-cleanup").start()
