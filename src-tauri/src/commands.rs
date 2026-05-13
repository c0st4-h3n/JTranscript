//! Tauri commands invocáveis pelo frontend.
//!
//! - `insert_text`: cola texto via HybridInserter, restaurando o foco capturado.
//! - `show_pill` / `hide_pill`: visibilidade da janela main, posicionada no
//!   canto inferior direito da tela primary.

use std::thread;
use std::time::Duration;

use tauri::{PhysicalPosition, Runtime, State, WebviewWindow};

use crate::hotkey::CapturedFocus;
use crate::inserter::{HybridInserter, InsertOutcome, Inserter};
use crate::window_focus::{is_valid_hwnd, restore_active_hwnd};

const FOCUS_SETTLE_MS: u64 = 50;
const PILL_MARGIN_RIGHT: i32 = 20;
const PILL_MARGIN_BOTTOM: i32 = 60; // acima da taskbar default do Windows

/// Resposta do `insert_text` pro frontend.
#[derive(Debug, serde::Serialize)]
pub struct InsertReport {
    pub outcome: &'static str,
    pub focus_restored: bool,
    pub captured_hwnd: Option<isize>,
}

#[tauri::command]
pub fn insert_text(
    text: String,
    inserter: State<HybridInserter>,
    focus: State<CapturedFocus>,
) -> Result<InsertReport, String> {
    let captured = focus.0.lock().ok().and_then(|g| *g);

    let mut focus_restored = false;
    if let Some(hwnd) = captured {
        if is_valid_hwnd(hwnd) {
            focus_restored = restore_active_hwnd(hwnd);
            if focus_restored {
                thread::sleep(Duration::from_millis(FOCUS_SETTLE_MS));
            }
        }
    }

    let outcome = inserter.insert(&text).map_err(|e| e.to_string())?;

    Ok(InsertReport {
        outcome: match outcome {
            InsertOutcome::Paste => "paste",
            InsertOutcome::Fallback => "fallback",
        },
        focus_restored,
        captured_hwnd: captured,
    })
}

#[tauri::command]
pub fn show_pill<R: Runtime>(window: WebviewWindow<R>) -> Result<(), String> {
    position_bottom_right(&window).map_err(|e| e.to_string())?;
    window.show().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn hide_pill<R: Runtime>(window: WebviewWindow<R>) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())?;
    Ok(())
}

/// Frontend chama isso quando o backend encerrou a sessão sozinho (VAD).
/// Mantém o `HotkeyState.is_recording` consistente pro próximo press toggle.
#[tauri::command]
pub fn note_auto_stop<R: Runtime>(app: tauri::AppHandle<R>) {
    crate::hotkey::note_external_stop(&app);
}

#[tauri::command]
pub fn open_settings<R: Runtime>(app: tauri::AppHandle<R>) -> Result<(), String> {
    use tauri::Manager;
    let window = app
        .get_webview_window("settings")
        .ok_or_else(|| "janela settings nao encontrada".to_string())?;
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn close_settings<R: Runtime>(app: tauri::AppHandle<R>) -> Result<(), String> {
    use tauri::Manager;
    if let Some(window) = app.get_webview_window("settings") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Frontend chama isso após salvar settings — sincroniza o `HotkeyState`
/// pro press/release reagir no modo novo sem precisar de restart.
#[tauri::command]
pub fn set_hotkey_mode(
    mode: String,
    state: State<crate::hotkey::HotkeyState>,
) -> Result<String, String> {
    use crate::hotkey::HotkeyMode;
    use std::str::FromStr;
    let parsed = HotkeyMode::from_str(&mode).map_err(|e| e)?;
    state.set_mode(parsed);
    Ok(parsed.as_str().to_string())
}

/// Permite que o frontend (React) escreva no `shell.log` — debug em release.
/// Sem DevTools acessíveis (mesmo com feature habilitada), essa é a forma
/// de o JS vazar mensagens pra log file inspecionável.
#[tauri::command]
pub fn log_event(msg: String) {
    crate::log_event!("[ui] {msg}");
}

/// Função pura: dado o tamanho da tela e da janela, devolve (x, y) pro canto
/// inferior direito com margem.
pub fn compute_bottom_right(
    screen_w: i32,
    screen_h: i32,
    window_w: i32,
    window_h: i32,
    margin_right: i32,
    margin_bottom: i32,
) -> (i32, i32) {
    let x = (screen_w - window_w - margin_right).max(0);
    let y = (screen_h - window_h - margin_bottom).max(0);
    (x, y)
}

fn position_bottom_right<R: Runtime>(window: &WebviewWindow<R>) -> tauri::Result<()> {
    let monitor = window
        .current_monitor()?
        .or_else(|| window.primary_monitor().ok().flatten());
    let Some(monitor) = monitor else {
        return Ok(()); // sem monitor — deixa onde estiver
    };
    let scale = monitor.scale_factor();
    let mon_size = monitor.size();
    let win_size = window.outer_size()?;

    let (x, y) = compute_bottom_right(
        mon_size.width as i32,
        mon_size.height as i32,
        win_size.width as i32,
        win_size.height as i32,
        (PILL_MARGIN_RIGHT as f64 * scale) as i32,
        (PILL_MARGIN_BOTTOM as f64 * scale) as i32,
    );

    // Usa Physical pra evitar reaplicar scale.
    let mon_pos = monitor.position();
    window.set_position(PhysicalPosition::new(mon_pos.x + x, mon_pos.y + y))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bottom_right_em_1920x1080_com_pill_380x88() {
        let (x, y) = compute_bottom_right(1920, 1080, 380, 88, 20, 60);
        assert_eq!(x, 1920 - 380 - 20); // 1520
        assert_eq!(y, 1080 - 88 - 60); // 932
    }

    #[test]
    fn bottom_right_em_tela_pequena_clampa_no_zero() {
        // tela menor que a pill: clamp em 0
        let (x, y) = compute_bottom_right(200, 100, 380, 88, 20, 60);
        assert_eq!(x, 0);
        assert_eq!(y, 0);
    }

    #[test]
    fn bottom_right_em_4k_3840x2160() {
        let (x, y) = compute_bottom_right(3840, 2160, 380, 88, 20, 60);
        assert_eq!(x, 3840 - 380 - 20);
        assert_eq!(y, 2160 - 88 - 60);
    }
}
