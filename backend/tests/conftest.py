"""Fixtures compartilhados.

- `audio_fixture_path`: WAV/MP3 em PT-BR gerado uma vez via edge-tts, cacheado no disco.
- skip automático de testes marcados `@pytest.mark.gpu` quando CUDA indisponivel.
"""

from __future__ import annotations

import asyncio
from pathlib import Path

import pytest

FIXTURE_TEXT = "Olá mundo, teste de transcrição em português."
FIXTURE_VOICE = "pt-BR-AntonioNeural"
FIXTURE_DIR = Path(__file__).parent / "fixtures"
FIXTURE_FILE = FIXTURE_DIR / "hello_mundo_pt.mp3"


def _detect_cuda() -> bool:
    try:
        from jarvstranscript.net.gpu_bootstrap import ensure_cuda_runtime_dlls

        ensure_cuda_runtime_dlls()
        import ctranslate2

        return ctranslate2.get_cuda_device_count() > 0
    except Exception:  # noqa: BLE001 — qualquer falha == sem cuda
        return False


CUDA_AVAILABLE = _detect_cuda()


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    del config
    if CUDA_AVAILABLE:
        return
    skip_gpu = pytest.mark.skip(reason="GPU CUDA nao detectada — pulando teste @gpu")
    for item in items:
        if "gpu" in item.keywords:
            item.add_marker(skip_gpu)


@pytest.fixture(scope="session")
def audio_fixture_path() -> Path:
    """Gera (ou reusa cache) um MP3 PT-BR via edge-tts com texto conhecido."""
    FIXTURE_DIR.mkdir(parents=True, exist_ok=True)
    if FIXTURE_FILE.exists() and FIXTURE_FILE.stat().st_size > 1024:
        return FIXTURE_FILE

    import edge_tts

    async def _gen() -> None:
        comm = edge_tts.Communicate(FIXTURE_TEXT, voice=FIXTURE_VOICE)
        await comm.save(str(FIXTURE_FILE))

    try:
        asyncio.run(_gen())
    except Exception as e:  # noqa: BLE001
        pytest.skip(f"edge-tts falhou (sem rede?): {e}")
    if not FIXTURE_FILE.exists() or FIXTURE_FILE.stat().st_size < 1024:
        pytest.skip("edge-tts nao gerou audio valido")
    return FIXTURE_FILE


@pytest.fixture(scope="session")
def fixture_expected_words() -> list[str]:
    """Palavras-chave aceitas no texto transcrito.

    Modelo `tiny` em PT-BR tem qualidade modesta — basta acertar ao menos uma
    palavra do texto-fonte pra validar que o pipeline rodou de verdade.
    """
    return ["mundo", "teste", "olá", "ola", "transcrição", "transcricao", "português", "portugues"]
