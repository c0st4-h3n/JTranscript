//! System tray — ícone na bandeja do Windows + menu de contexto.
//!
//! Menu:
//! - Abrir Settings   → mostra/focar janela settings
//! - Mostrar Pill     → debug: força a pill a aparecer mesmo sem ditar
//! - Sobre            → abre URL do repo no browser default
//! - Sair             → encerra o app
//!
//! Click esquerdo no ícone → abre Settings (atalho do menu mais usado).

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, Runtime};

const REPO_URL: &str = "https://github.com/c0st4-h3n/JTranscript";

pub fn install<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let menu = build_menu(app)?;

    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().cloned().unwrap_or_else(|| {
            // fallback teórico — generate_context! sempre injeta um icon
            panic!("default_window_icon ausente — checar tauri.conf.json/icons")
        }))
        .tooltip("JarvsTranscript — F8 pra ditar")
        .menu(&menu)
        .menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open_settings" => open_settings(app),
            "show_pill" => show_pill(app),
            "about" => open_url(REPO_URL),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            // Click esquerdo no ícone → Settings (atalho do menu mais usado)
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                open_settings(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

fn build_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let settings_item = MenuItem::with_id(
        app,
        "open_settings",
        "Abrir Settings (Ctrl+Alt+S)",
        true,
        None::<&str>,
    )?;
    let show_pill_item =
        MenuItem::with_id(app, "show_pill", "Mostrar Pill (debug)", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let about_item = MenuItem::with_id(app, "about", "Sobre — GitHub", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;

    Menu::with_items(
        app,
        &[
            &settings_item,
            &show_pill_item,
            &separator,
            &about_item,
            &quit_item,
        ],
    )
}

fn open_settings<R: Runtime>(app: &AppHandle<R>) {
    let Some(window) = app.get_webview_window("settings") else {
        eprintln!("[tray] janela settings nao encontrada");
        return;
    };
    let _ = window.show();
    let _ = window.set_focus();
}

fn show_pill<R: Runtime>(app: &AppHandle<R>) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    let _ = crate::commands::show_pill(window);
}

fn open_url(url: &str) {
    #[cfg(windows)]
    {
        let _ = std::process::Command::new("cmd")
            .args(["/C", "start", "", url])
            .spawn();
    }
    #[cfg(not(windows))]
    {
        let _ = url;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn repo_url_aponta_pro_github() {
        assert!(REPO_URL.starts_with("https://github.com/"));
        assert!(REPO_URL.contains("JTranscript"));
    }
}
