//! JarvsTranscript shell — Tauri 2 + módulos puros.
//!
//! - Hotkeys globais `F8` (gravar) e `Ctrl+Alt+S` (settings) (Fase 4/9)
//! - Modo PTT ou Toggle via env `JARVSTRANSCRIPT_MODE` (Fase 7)
//! - Inserter híbrido clipboard + SendInput (Fase 6)
//! - Pill bottom-right, hidden default (Fase 5)
//! - Command `insert_text` invocado pelo frontend ao receber `final`
//! - Backend Python como sidecar `.exe` quando rodando do MSI install (Fase D)
//! - Single instance + log persistente em `%LOCALAPPDATA%\JarvsTranscript\shell.log`

pub mod commands;
pub mod hotkey;
pub mod inserter;
pub mod logger;
pub mod sidecar;
pub mod tray;
pub mod window_focus;

use std::sync::Arc;

use hotkey::{
    build_plugin, locate_config_path, register_default, resolve_mode, CapturedFocus, HotkeyState,
};
use inserter::{ClipboardInserter, HybridInserter, Inserter, SendInputInserter};
use sidecar::BackendHandle;
use tauri::Manager;

fn build_default_inserter() -> HybridInserter {
    let primary: Arc<dyn Inserter> = Arc::new(ClipboardInserter::new());
    let fallback: Arc<dyn Inserter> = Arc::new(SendInputInserter::new());
    HybridInserter::new(primary, fallback)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Resolve mode: env > data/config.json (com fallback CWD/parent) > default PTT
    let config_path = locate_config_path();
    let mode = resolve_mode(&config_path);

    tauri::Builder::default()
        // Single instance: 2a tentativa de abrir o app foca o Settings ao invés
        // de criar processo paralelo (evita conflito de hotkey global + porta 7979).
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            crate::log_event!("[jarvstranscript] 2a instancia detectada — focando settings");
            if let Some(window) = app.get_webview_window("settings") {
                let _ = window.show();
                let _ = window.set_focus();
            } else if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(build_plugin())
        .manage(CapturedFocus::default())
        .manage(HotkeyState::new(mode))
        .manage(BackendHandle::default())
        .manage(build_default_inserter())
        .invoke_handler(tauri::generate_handler![
            commands::insert_text,
            commands::show_pill,
            commands::hide_pill,
            commands::note_auto_stop,
            commands::open_settings,
            commands::close_settings,
            commands::set_hotkey_mode,
        ])
        .setup(move |app| {
            // Logger: aponta pro AppData local. Idempotente.
            if let Ok(log_dir) = app.path().app_local_data_dir() {
                logger::init(log_dir.join("shell.log"));
            }
            log_event!(
                "[jarvstranscript] boot — hotkey mode: {} (config: {})",
                mode.as_str(),
                config_path.display()
            );

            if let Err(e) = register_default(&app.handle()) {
                log_event!("[jarvstranscript] FALHA ao registrar hotkey: {e}");
            } else {
                log_event!(
                    "[jarvstranscript] hotkey registrada: {} (gravar) + {} (settings)",
                    hotkey::DEFAULT_HOTKEY,
                    hotkey::SETTINGS_HOTKEY
                );
            }
            if let Err(e) = tray::install(&app.handle()) {
                log_event!("[jarvstranscript] FALHA ao instalar tray: {e}");
            }
            // Sidecar — em modo MSI, spawna o backend.exe. Em dev, no-op.
            match sidecar::spawn_if_present(&app.handle()) {
                Ok(true) => log_event!("[jarvstranscript] sidecar backend.exe spawnado"),
                Ok(false) => log_event!("[jarvstranscript] sem sidecar — modo dev"),
                Err(e) => log_event!("[jarvstranscript] FALHA sidecar: {e}"),
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if matches!(event, tauri::WindowEvent::Destroyed) {
                if window.app_handle().webview_windows().is_empty() {
                    sidecar::kill(window.app_handle());
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("erro ao iniciar tauri runtime");
}
