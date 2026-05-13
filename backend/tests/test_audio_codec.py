"""Testes do `voice.audio_codec` — decode PCM base64 + leitura de arquivo."""

from __future__ import annotations

import base64
from pathlib import Path

import numpy as np
import pytest

from jarvstranscript.voice.audio_codec import (
    TARGET_SAMPLE_RATE,
    decode_pcm_f32_b64,
    load_audio_file,
)


class TestDecodePcmF32B64:
    def test_round_trip_preserva_amostras(self) -> None:
        samples = np.array([0.1, -0.2, 0.5, 0.0, 0.99, -0.99], dtype=np.float32)
        b64 = base64.b64encode(samples.tobytes()).decode("ascii")
        out = decode_pcm_f32_b64(b64)
        assert out.dtype == np.float32
        np.testing.assert_array_equal(out, samples)

    def test_payload_vazio_devolve_array_vazio(self) -> None:
        out = decode_pcm_f32_b64("")
        assert out.shape == (0,)
        assert out.dtype == np.float32

    def test_bytes_desalinhados_levantam_value_error(self) -> None:
        bad = base64.b64encode(b"abc").decode("ascii")
        with pytest.raises(ValueError, match="desalinhado"):
            decode_pcm_f32_b64(bad)

    def test_array_retornado_e_independente_do_buffer(self) -> None:
        samples = np.array([0.5, 0.5], dtype=np.float32)
        b64 = base64.b64encode(samples.tobytes()).decode("ascii")
        out = decode_pcm_f32_b64(b64)
        out[0] = 0.0  # nao deve estourar (buffer e writable)
        assert out[0] == 0.0


class TestLoadAudioFile:
    def test_arquivo_inexistente_levanta(self, tmp_path: Path) -> None:
        with pytest.raises(Exception):  # av.OSError ou similar
            load_audio_file(tmp_path / "nao-existe.mp3")

    def test_carrega_fixture_em_16k_mono_float32(self, audio_fixture_path: Path) -> None:
        audio = load_audio_file(audio_fixture_path)
        assert audio.dtype == np.float32
        assert audio.ndim == 1
        # ~3-5s @ 16kHz = 48k a 80k samples (margem larga pra TTS variar)
        assert audio.shape[0] > 16000, f"audio curto demais: {audio.shape}"
        assert audio.shape[0] < 16000 * 15, f"audio longo demais: {audio.shape}"
        # amplitude tem que ter algum sinal (nao silencio)
        assert float(np.abs(audio).max()) > 0.01, "fixture parece silencio"

    def test_target_sample_rate_e_16k(self) -> None:
        assert TARGET_SAMPLE_RATE == 16_000
