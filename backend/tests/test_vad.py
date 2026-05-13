"""Testes do RmsVAD — heurística RMS pra ativar com energia acima de threshold."""

from __future__ import annotations

import numpy as np
import pytest

from jarvstranscript.voice.vad import RmsVAD


class TestRmsVAD:
    def test_silencio_total_nao_e_voz(self) -> None:
        vad = RmsVAD(threshold=0.01)
        silence = np.zeros(16_000, dtype=np.float32)
        assert vad.is_speech(silence) is False

    def test_sine_wave_alto_e_voz(self) -> None:
        vad = RmsVAD(threshold=0.01)
        t = np.linspace(0, 1, 16_000, dtype=np.float32)
        sine = (0.5 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)
        assert vad.is_speech(sine) is True

    def test_ruido_abaixo_do_threshold_nao_e_voz(self) -> None:
        vad = RmsVAD(threshold=0.05)
        # ruído com RMS ~ 0.003 (bem abaixo do threshold 0.05)
        rng = np.random.default_rng(42)
        quiet = (rng.standard_normal(16_000) * 0.005).astype(np.float32)
        assert vad.is_speech(quiet) is False

    def test_array_vazio_nao_e_voz(self) -> None:
        vad = RmsVAD()
        assert vad.is_speech(np.zeros(0, dtype=np.float32)) is False

    def test_threshold_negativo_explode(self) -> None:
        with pytest.raises(ValueError, match="negativo"):
            RmsVAD(threshold=-0.1)
