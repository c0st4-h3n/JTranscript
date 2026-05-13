"""Bootstrap pra CUDA no Windows quando cuBLAS/cuDNN vem via pip nvidia-* wheels.

Python no Windows nao herda automaticamente o PATH dentro de pacotes pra resolver
DLLs nativas. Sem isto, `import ctranslate2` (dep do faster-whisper) falha em
runtime com `OSError: cudnn_ops64_X.dll nao encontrado` mesmo com as wheels instaladas.

Chamada idempotente — pode ser invocada várias vezes sem efeito colateral.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

# As `DllDirectoryCookie`s precisam ficar vivas pelo lifetime do processo —
# se o GC limpar, Windows remove o dir do search path silenciosamente e
# `LoadLibrary("cublas64_12.dll")` volta a falhar mesmo depois de adicionado.
_LIVE_COOKIES: list[Any] = []
_ADDED_DIRS: list[Path] = []


def ensure_cuda_runtime_dlls() -> list[Path]:
    """Adiciona dirs com DLLs CUDA ao DLL search path do Windows.

    Cobre 2 cenários:
    1. **Dev (venv)**: DLLs em `site-packages/nvidia/<pkg>/bin/`. Procura cada um.
    2. **PyInstaller bundle**: `collect_dynamic_libs` empacota DLLs flattened
       em `sys._MEIPASS` (mesmo dir do .exe). Adiciona o `_MEIPASS` inteiro.

    Idempotente; retorna a lista (cumulativa) de dirs adicionados.
    No-op fora do Windows.
    """
    if sys.platform != "win32":
        return list(_ADDED_DIRS)
    add_dir = getattr(os, "add_dll_directory", None)
    if add_dir is None:
        return list(_ADDED_DIRS)

    # ---- Bundle PyInstaller (sys._MEIPASS) -------------------------------
    # Quando rodando dentro do bundle, _MEIPASS é o root onde as DLLs
    # nativas ficam ao lado do binário (collect_dynamic_libs flatten elas).
    meipass = getattr(sys, "_MEIPASS", None)
    if meipass:
        bundle_dir = Path(meipass)
        if bundle_dir.exists() and bundle_dir not in _ADDED_DIRS:
            cookie = add_dir(str(bundle_dir))
            _LIVE_COOKIES.append(cookie)
            _ADDED_DIRS.append(bundle_dir)
            _prepend_path(str(bundle_dir))

    # ---- Dev (site-packages/nvidia/*/bin) --------------------------------
    for site in _iter_site_packages():
        nvidia_root = site / "nvidia"
        if not nvidia_root.exists():
            continue
        for sub in ("cublas", "cudnn", "cuda_runtime", "cuda_nvrtc", "cufft"):
            bin_dir = nvidia_root / sub / "bin"
            if bin_dir.exists() and bin_dir not in _ADDED_DIRS:
                cookie = add_dir(str(bin_dir))
                _LIVE_COOKIES.append(cookie)
                _ADDED_DIRS.append(bin_dir)
                # CTranslate2/cuBLAS usam loader legacy que ignora AddDllDirectory.
                # Prepend no PATH cobre esse caminho.
                _prepend_path(str(bin_dir))
    return list(_ADDED_DIRS)


def _prepend_path(directory: str) -> None:
    current = os.environ.get("PATH", "")
    parts = current.split(os.pathsep) if current else []
    if directory in parts:
        return
    os.environ["PATH"] = directory + os.pathsep + current


def _iter_site_packages() -> list[Path]:
    seen: list[Path] = []
    for p in sys.path:
        if not p:
            continue
        path = Path(p)
        if "site-packages" in path.as_posix() and path.exists() and path not in seen:
            seen.append(path)
    return seen
