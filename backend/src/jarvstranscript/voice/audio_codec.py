"""Decode de áudio — bytes/arquivos -> `numpy.ndarray` float32 mono @ 16kHz.

`decode_pcm_f32_b64` cobre o caminho quente: frontend manda PCM float32 LE base64
(via WebSocket), backend converte sem cópia pesada.

`load_audio_file` cobre testes e ferramentas: decodifica qualquer formato que o
ffmpeg suporte (MP3, OGG, WAV, FLAC) e reamostra pra 16kHz mono via PyAV (`av`).
"""

from __future__ import annotations

import base64
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

TARGET_SAMPLE_RATE = 16_000


def decode_pcm_f32_b64(b64: str) -> NDArray[np.float32]:
    """Decodifica payload base64 (PCM float32 little-endian) para array mono.

    Levanta `ValueError` se o número de bytes não for múltiplo de 4 (float32).
    """
    raw = base64.b64decode(b64) if b64 else b""
    if len(raw) % 4 != 0:
        raise ValueError(f"payload pcm desalinhado: {len(raw)} bytes (esperava multiplo de 4)")
    if not raw:
        return np.zeros(0, dtype=np.float32)
    # `.copy()` desvincula o array do buffer base64, evitando bug se o caller mutar.
    return np.frombuffer(raw, dtype=np.float32).copy()


def load_audio_file(
    path: Path | str,
    sample_rate: int = TARGET_SAMPLE_RATE,
) -> NDArray[np.float32]:
    """Lê um arquivo de áudio e retorna float32 mono @ `sample_rate`.

    Usa PyAV (que vem com faster-whisper) — não exige ffmpeg externo no PATH.
    """
    import av

    container = av.open(str(path))
    try:
        stream = next((s for s in container.streams if s.type == "audio"), None)
        if stream is None:
            raise ValueError(f"sem stream de audio em {path!s}")
        resampler = av.audio.resampler.AudioResampler(
            format="flt", layout="mono", rate=sample_rate
        )
        chunks: list[NDArray[np.float32]] = []
        for frame in container.decode(stream):
            for resampled in resampler.resample(frame):
                arr = resampled.to_ndarray().flatten().astype(np.float32, copy=False)
                chunks.append(arr)
        # Flush do resampler
        for resampled in resampler.resample(None):
            arr = resampled.to_ndarray().flatten().astype(np.float32, copy=False)
            chunks.append(arr)
    finally:
        container.close()

    if not chunks:
        return np.zeros(0, dtype=np.float32)
    return np.concatenate(chunks)
