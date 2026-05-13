# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec — empacota o backend Python como executável standalone
pra ser embarcado como sidecar no MSI Tauri.

Inclui:
- jarvstranscript (nosso pacote inteiro via hidden imports)
- faster-whisper + ctranslate2 (runtime CTranslate2 + tokenizers)
- silero-vad ONNX model como data file
- av (PyAV decodifica audio)
- DLLs CUDA das wheels nvidia-* (cublas, cudnn, cudart, cuda_nvrtc)
- websockets + structlog

Build:
    cd backend
    .venv\\Scripts\\python.exe -m PyInstaller build-backend.spec --clean --noconfirm

Saída:
    backend/dist/jarvstranscript-backend/ — pasta com o .exe + _internal/
"""

from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs

# ---- hidden imports ---------------------------------------------------------
# PyInstaller não detecta imports dinâmicos (via importlib, plugin systems,
# strings runtime). Esses são os pacotes que precisamos garantir presentes.
hidden_imports = [
    # Nosso código (alguns submódulos são importados lazy via `from x import y`)
    "jarvstranscript",
    "jarvstranscript.adapters",
    "jarvstranscript.adapters.stt_container",
    "jarvstranscript.adapters.stt_whisper",
    "jarvstranscript.core",
    "jarvstranscript.core.ports",
    "jarvstranscript.ipc",
    "jarvstranscript.ipc.log_stream",
    "jarvstranscript.ipc.session_handler",
    "jarvstranscript.ipc.ws_server",
    "jarvstranscript.main",
    "jarvstranscript.net",
    "jarvstranscript.net.gpu_bootstrap",
    "jarvstranscript.settings",
    "jarvstranscript.settings.config",
    "jarvstranscript.settings.manager",
    "jarvstranscript.voice",
    "jarvstranscript.voice.audio_codec",
    "jarvstranscript.voice.model_cache",
    "jarvstranscript.voice.streaming",
    "jarvstranscript.voice.vad",
    # Runtime STT
    "faster_whisper",
    "ctranslate2",
    "av",
    "huggingface_hub",
    # VAD
    "silero_vad",
    "onnxruntime",
    # IPC + utils
    "websockets",
    "websockets.asyncio.server",
    "structlog",
    "numpy",
]

# ---- data files -------------------------------------------------------------
datas = []
# silero-vad bundla o ONNX model como package data — PyInstaller precisa de hint
datas += collect_data_files("silero_vad", includes=["**/*.onnx", "**/*.jit"])
# faster-whisper inclui assets de tokenizer (opcional — geralmente baixados em runtime)
datas += collect_data_files("faster_whisper", includes=["**/*.json", "**/*.tiktoken"])

# ---- binaries (DLLs nativas) -----------------------------------------------
binaries = []
# CUDA libs das wheels nvidia-* — críticas pro funcionamento na GPU
for pkg in (
    "nvidia.cublas",
    "nvidia.cudnn",
    "nvidia.cuda_runtime",
    "nvidia.cuda_nvrtc",
):
    try:
        binaries += collect_dynamic_libs(pkg)
    except Exception:
        # Pacote pode não estar instalado em ambientes sem GPU — segue
        pass

# ---- excludes ---------------------------------------------------------------
# Tira módulos pesados que sabemos não precisar. Reduz tamanho do bundle.
excludes = [
    "torch",         # silero-vad com onnxruntime não precisa de PyTorch
    "torchaudio",
    "tensorflow",
    "matplotlib",
    "pandas",
    "scipy",
    "PIL",
    "tkinter",
    "test",
    "tests",
    "pytest",
]


a = Analysis(
    ["src/jarvstranscript/main.py"],
    pathex=["src"],
    binaries=binaries,
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=excludes,
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="jarvstranscript-backend",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    # console=True pra logs visíveis durante dev/debug do MSI. Quando
    # rodando como sidecar dentro do Tauri, stdout é capturada pelo shell.
    console=True,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="jarvstranscript-backend",
)
