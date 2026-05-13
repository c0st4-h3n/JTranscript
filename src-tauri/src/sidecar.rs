//! Sidecar — gerencia o ciclo de vida do `jarvstranscript-backend.exe`
//! quando o app roda em modo bundle (MSI). Em modo dev (cargo tauri dev),
//! o backend é levantado pelo `dev.ps1` separado — esse módulo só atua
//! quando detecta o sidecar no `resource dir`.
//!
//! Spawn no setup do Tauri, redireciona stdout/stderr pra arquivo de log
//! em `%LOCALAPPDATA%\io.jarvinho.transcript\backend.log`, kill no shutdown.

use std::sync::Mutex;

use tauri::{AppHandle, Manager, Runtime};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

/// Handle do processo backend pra mantermos vivo + matar no shutdown.
#[derive(Default)]
pub struct BackendHandle(pub Mutex<Option<std::process::Child>>);

/// Tenta achar e spawnar o sidecar `jarvstranscript-backend.exe`.
/// Retorna `Ok(false)` se não encontrou (modo dev) — sem erro.
pub fn spawn_if_present<R: Runtime>(app: &AppHandle<R>) -> Result<bool, String> {
    // Em modo debug (cargo tauri dev), o dev.ps1 já sobe o backend Python
    // separadamente. Sidecar.exe tentaria bind 7979 e falharia — skip.
    if cfg!(debug_assertions) {
        crate::log_event!("[sidecar] debug profile — pulando spawn (use dev.ps1 pro backend)");
        return Ok(false);
    }

    let exe_name = if cfg!(windows) {
        "jarvstranscript-backend.exe"
    } else {
        "jarvstranscript-backend"
    };

    // Procura em `resource_dir/backend/` (onde MSI extrai o bundle do backend).
    let resource_path = app
        .path()
        .resource_dir()
        .ok()
        .map(|d| d.join("backend").join(exe_name));

    let Some(exe_path) = resource_path.filter(|p| p.exists()) else {
        crate::log_event!("[sidecar] backend.exe ausente em resource_dir/backend/ — modo dev");
        return Ok(false);
    };

    // Diretório de logs/config — `%LOCALAPPDATA%\io.jarvinho.transcript\`
    let app_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("falha ao resolver app_local_data_dir: {e}"))?;
    let _ = std::fs::create_dir_all(&app_data_dir);

    // Redireciona stdout/stderr do backend pra arquivos. Shell é GUI sem
    // console, então sem isso os logs vão pro void.
    let stdout_path = app_data_dir.join("backend.log");
    let stderr_path = app_data_dir.join("backend.err");
    let config_path = app_data_dir.join("config.json");

    let stdout_file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&stdout_path)
        .map_err(|e| format!("falha ao abrir {}: {e}", stdout_path.display()))?;
    let stderr_file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&stderr_path)
        .map_err(|e| format!("falha ao abrir {}: {e}", stderr_path.display()))?;

    crate::log_event!("[sidecar] spawnando {}", exe_path.display());
    crate::log_event!("[sidecar] stdout -> {}", stdout_path.display());
    crate::log_event!("[sidecar] config -> {}", config_path.display());

    let mut cmd = std::process::Command::new(&exe_path);
    cmd.stdout(stdout_file)
        .stderr(stderr_file)
        // Aponta o backend pro mesmo config.json que a UI Settings usa.
        // Sem isso, o backend cai pra default (cwd/data/config.json — vazio no install).
        .env("JARVSTRANSCRIPT_CONFIG_PATH", &config_path);

    // Em Windows, evita herdar handles que possam segurar o processo no shutdown.
    #[cfg(windows)]
    {
        // CREATE_NO_WINDOW = 0x08000000 — não abre console preta extra
        cmd.creation_flags(0x0800_0000);
    }

    let child = cmd
        .spawn()
        .map_err(|e| format!("falha ao spawnar sidecar: {e}"))?;

    if let Some(state) = app.try_state::<BackendHandle>() {
        if let Ok(mut guard) = state.0.lock() {
            *guard = Some(child);
        }
    }

    Ok(true)
}

/// Mata o backend no shutdown — chamar do exit handler do app.
pub fn kill<R: Runtime>(app: &AppHandle<R>) {
    let Some(state) = app.try_state::<BackendHandle>() else {
        return;
    };
    let Ok(mut guard) = state.0.lock() else {
        return;
    };
    if let Some(mut child) = guard.take() {
        crate::log_event!("[sidecar] encerrando backend PID={}", child.id());
        let _ = child.kill();
        let _ = child.wait();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backend_handle_inicia_vazio() {
        let h = BackendHandle::default();
        assert!(h.0.lock().unwrap().is_none());
    }
}
