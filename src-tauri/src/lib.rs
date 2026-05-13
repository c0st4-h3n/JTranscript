//! JarvsTranscript shell — Tauri 2 + módulos puros.
//!
//! - Hotkeys globais `F8` (gravar) e `Ctrl+Alt+S` (settings) (Fase 4/9)
//! - Modo PTT ou Toggle via env `JARVSTRANSCRIPT_MODE` (Fase 7)
//! - Inserter híbrido clipboard + SendInput (Fase 6)
//! - Pill bottom-right, hidden default (Fase 5)
//! - Command `insert_text` invocado pelo frontend ao receber `final`

pub mod commands;
pub mod hotkey;
pub mod inserter;
pub mod window_focus;

use std::sync::Arc;

use hotkey::{
    build_plugin, locate_config_path, register_default, resolve_mode, CapturedFocus, HotkeyState,
};
use inserter::{ClipboardInserter, HybridInserter, Inserter, SendInputInserter};

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
    eprintln!(
        "[jarvstranscript] hotkey mode: {} (config: {})",
        mode.as_str(),
        config_path.display()
    );

    tauri::Builder::default()
        .plugin(build_plugin())
        .manage(CapturedFocus::default())
        .manage(HotkeyState::new(mode))
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
        .setup(|app| {
            if let Err(e) = register_default(&app.handle()) {
                eprintln!("[jarvstranscript] falha ao registrar hotkey: {e}");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erro ao iniciar tauri runtime");
}
