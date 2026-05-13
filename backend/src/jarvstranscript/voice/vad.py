"""Adapters de VAD (Voice Activity Detection).

- `RmsVAD`: heurística simples — energia RMS acima de threshold = voz. Sem deps
  externas, determinístico — usado em testes e como fallback se silero falhar.
- `SileroVAD`: modelo ONNX leve baixado via pacote `silero-vad`. Mais robusto a
  ruído de fundo. Carregamento lazy/pesado — construir uma vez no boot.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import numpy as np

if TYPE_CHECKING:
    from numpy.typing import NDArray

SILERO_FRAME_SAMPLES = 512  # @ 16kHz = 32ms, exigência do modelo
SILERO_DEFAULT_THRESHOLD = 0.5


class RmsVAD:
    """VAD baseado em energia RMS. Threshold em escala de Float32 PCM ([-1, 1])."""

    def __init__(self, threshold: float = 0.01) -> None:
        if threshold < 0:
            raise ValueError("threshold nao pode ser negativo")
        self._threshold = threshold

    def is_speech(self, audio: NDArray[np.float32]) -> bool:
        if audio.size == 0:
            return False
        rms = float(np.sqrt(np.mean(audio.astype(np.float32) ** 2)))
        return rms > self._threshold


class SileroVAD:
    """Adapter pro modelo Silero VAD via pacote `silero-vad` (ONNX runtime).

    Construtor pode falhar (sem internet na primeira execução, modelo corrupto,
    ONNX runtime ausente). Caller deve estar preparado pra cair pra `RmsVAD`.
    """

    def __init__(
        self,
        threshold: float = SILERO_DEFAULT_THRESHOLD,
        sample_rate: int = 16_000,
    ) -> None:
        if sample_rate not in (8_000, 16_000):
            raise ValueError("silero suporta apenas 8000 ou 16000 Hz")
        from silero_vad import load_silero_vad

        self._model = load_silero_vad(onnx=True)
        self._threshold = threshold
        self._sample_rate = sample_rate
        # silero é stateful — reset entre sessões se for reusar.
        self._frame_samples = (
            SILERO_FRAME_SAMPLES if sample_rate == 16_000 else SILERO_FRAME_SAMPLES // 2
        )

    def reset(self) -> None:
        """Limpa estado interno do modelo (entre sessões)."""
        if hasattr(self._model, "reset_states"):
            self._model.reset_states()

    def is_speech(self, audio: NDArray[np.float32]) -> bool:
        if audio.size < self._frame_samples:
            return False
        # Silero quer torch tensor de exatamente `frame_samples`. Quebramos o
        # chunk em janelas; basta UMA janela acima do threshold pra considerar voz.
        import torch

        audio_f32 = audio.astype(np.float32, copy=False)
        for start in range(0, audio_f32.size - self._frame_samples + 1, self._frame_samples):
            window = audio_f32[start : start + self._frame_samples]
            tensor = torch.from_numpy(window)
            prob = float(self._model(tensor, self._sample_rate).item())
            if prob > self._threshold:
                return True
        return False
