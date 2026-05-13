//! Hotkey global Ctrl+Shift+R — registra via tauri-plugin-global-shortcut e
//! emite eventos `dictation:start`/`dictation:stop` pro frontend.
//!
//! Captura o HWND da janela em foreground IMEDIATAMENTE no `Pressed` (antes
//! de qualquer race) e guarda em `tauri::State<CapturedFocus>` pro Inserter
//! da Fase 6 restaurar o foco antes de colar.
//!
//! Modos (Fase 7):
//! - **PTT (push-to-talk)**: press inicia, release encerra. Default.
//! - **Toggle**: 1° press inicia, 2° press encerra (release ignorado). Backend
//!   também pode encerrar via VAD (silêncio > 3s).

use std::str::FromStr;
use std::sync::atomic::{AtomicBool, AtomicU8, Ordering};
use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, Runtime};
use tauri_plugin_global_shortcut::{Builder as ShortcutBuilder, ShortcutState};

use crate::window_focus::capture_active_hwnd;

// Convenção parcial: atalho de Settings usa `Ctrl+Alt+<letra>` (padrão coeso).
// Gravação é tecla única (F8) porque na máquina-alvo a NVIDIA App rouba
// Ctrl+Alt+R e Windows/IME come Ctrl+Alt+Space. F8 é zero-conflito.

/// Hotkey de gravação (PTT/Toggle). Tecla única, sem modifier — ergonômica
/// pra hold-to-talk e sem conflito conhecido no Windows.
pub const DEFAULT_HOTKEY: &str = "F8";

/// Hotkey pra abrir a janela de settings.
pub const SETTINGS_HOTKEY: &str = "CmdOrCtrl+Alt+S";

/// Modo de captura via hotkey.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HotkeyMode {
    Ptt,
    Toggle,
}

impl HotkeyMode {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Ptt => "ptt",
            Self::Toggle => "toggle",
        }
    }
}

impl Default for HotkeyMode {
    fn default() -> Self {
        Self::Ptt
    }
}

impl FromStr for HotkeyMode {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.trim().to_ascii_lowercase().as_str() {
            "ptt" | "hold" | "push-to-talk" => Ok(Self::Ptt),
            "toggle" | "tog" => Ok(Self::Toggle),
            other => Err(format!("modo invalido: {other:?} (use ptt|toggle)")),
        }
    }
}

/// Carrega o modo via env var `JARVSTRANSCRIPT_MODE`, default PTT.
pub fn mode_from_env() -> HotkeyMode {
    std::env::var("JARVSTRANSCRIPT_MODE")
        .ok()
        .and_then(|s| HotkeyMode::from_str(&s).ok())
        .unwrap_or_default()
}

/// Lê o `mode` do `data/config.json` (best effort). Usado pra fallback quando
/// o env não tá setado — frontend depois resincroniza, mas isso evita o flash
/// de "PTT por 200ms" no boot quando o usuário tinha `toggle` salvo.
pub fn mode_from_config_file(config_path: &std::path::Path) -> Option<HotkeyMode> {
    let raw = std::fs::read_to_string(config_path).ok()?;
    let parsed: serde_json::Value = serde_json::from_str(&raw).ok()?;
    let mode_str = parsed.get("mode")?.as_str()?;
    HotkeyMode::from_str(mode_str).ok()
}

/// Combina as duas fontes: env > config.json > default PTT.
pub fn resolve_mode(config_path: &std::path::Path) -> HotkeyMode {
    if let Ok(env_val) = std::env::var("JARVSTRANSCRIPT_MODE") {
        if let Ok(m) = HotkeyMode::from_str(&env_val) {
            return m;
        }
    }
    mode_from_config_file(config_path).unwrap_or_default()
}

/// Resolve o path do `config.json` tentando, em ordem:
/// 1. Env `JARVSTRANSCRIPT_CONFIG_PATH` (explícito)
/// 2. `{cwd}/data/config.json` (rodando do repo root)
/// 3. `{cwd}/../data/config.json` (rodando do src-tauri via `cargo tauri dev`)
///
/// Retorna o primeiro path que EXISTE, ou o último candidato (não-existente)
/// se nenhum bater — caller continua, mode_from_config_file devolve None.
pub fn locate_config_path() -> std::path::PathBuf {
    if let Ok(env_path) = std::env::var("JARVSTRANSCRIPT_CONFIG_PATH") {
        return std::path::PathBuf::from(env_path);
    }
    let cwd = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
    let candidates = [
        cwd.join("data").join("config.json"),
        cwd.join("..").join("data").join("config.json"),
    ];
    for c in &candidates {
        if c.exists() {
            return c.clone();
        }
    }
    candidates[0].clone()
}

/// HWND da app em foco no momento do press — usado pra restaurar foco antes do paste.
#[derive(Default)]
pub struct CapturedFocus(pub Mutex<Option<isize>>);

const MODE_PTT_U8: u8 = 0;
const MODE_TOGGLE_U8: u8 = 1;

/// Estado runtime da hotkey — mode escolhido (mutável via `set_mode` durante
/// settings hot-reload) + flag de "sessão ativa" pro toggle.
pub struct HotkeyState {
    mode: AtomicU8,
    pub is_recording: AtomicBool,
}

impl HotkeyState {
    pub fn new(mode: HotkeyMode) -> Self {
        Self {
            mode: AtomicU8::new(mode_to_u8(mode)),
            is_recording: AtomicBool::new(false),
        }
    }

    pub fn mode(&self) -> HotkeyMode {
        u8_to_mode(self.mode.load(Ordering::Acquire))
    }

    pub fn set_mode(&self, mode: HotkeyMode) {
        self.mode.store(mode_to_u8(mode), Ordering::Release);
    }
}

fn mode_to_u8(m: HotkeyMode) -> u8 {
    match m {
        HotkeyMode::Ptt => MODE_PTT_U8,
        HotkeyMode::Toggle => MODE_TOGGLE_U8,
    }
}

fn u8_to_mode(v: u8) -> HotkeyMode {
    match v {
        MODE_TOGGLE_U8 => HotkeyMode::Toggle,
        _ => HotkeyMode::Ptt,
    }
}

#[derive(Clone, Serialize)]
struct StartPayload {
    source: &'static str,
    mode: &'static str,
    captured_hwnd: Option<isize>,
}

#[derive(Clone, Serialize)]
struct StopPayload {}

/// Constrói o plugin com o handler de press/release. Registrar no Tauri Builder.
pub fn build_plugin<R: Runtime>() -> tauri::plugin::TauriPlugin<R> {
    use tauri_plugin_global_shortcut::Shortcut;
    use std::str::FromStr as _;

    ShortcutBuilder::new()
        .with_handler(|app, shortcut, event| {
            // Resolve uma vez por callback. `Shortcut::from_str` aceita o
            // formato "CmdOrCtrl+Shift+Comma" etc.
            if let Ok(settings_sc) = Shortcut::from_str(SETTINGS_HOTKEY) {
                if shortcut == &settings_sc {
                    if matches!(event.state(), ShortcutState::Pressed) {
                        on_settings_pressed(app);
                    }
                    return;
                }
            }
            // Default: comportamento da hotkey principal (PTT/Toggle)
            match event.state() {
                ShortcutState::Pressed => on_pressed(app),
                ShortcutState::Released => on_released(app),
            }
        })
        .build()
}

/// Registra hotkey principal + settings. Chamar dentro do `setup()` do Tauri Builder.
pub fn register_default<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;
    app.global_shortcut().register(DEFAULT_HOTKEY)?;
    if let Err(e) = app.global_shortcut().register(SETTINGS_HOTKEY) {
        // settings hotkey é nice-to-have — não derruba o app se já estiver em uso
        eprintln!("[jarvstranscript] settings hotkey nao registrou: {e}");
    }
    Ok(())
}

fn on_pressed<R: Runtime>(app: &AppHandle<R>) {
    let mode = app
        .try_state::<HotkeyState>()
        .map(|s| s.mode())
        .unwrap_or_default();

    match mode {
        HotkeyMode::Ptt => fire_start(app, mode),
        HotkeyMode::Toggle => {
            let state = app.state::<HotkeyState>();
            let was_recording = state.is_recording.fetch_xor(true, Ordering::SeqCst);
            if was_recording {
                fire_stop(app);
            } else {
                fire_start(app, mode);
            }
        }
    }
}

fn on_released<R: Runtime>(app: &AppHandle<R>) {
    let mode = app
        .try_state::<HotkeyState>()
        .map(|s| s.mode())
        .unwrap_or_default();

    if matches!(mode, HotkeyMode::Ptt) {
        fire_stop(app);
    }
    // Toggle ignora release — só reage ao press
}

fn fire_start<R: Runtime>(app: &AppHandle<R>, mode: HotkeyMode) {
    let hwnd = capture_active_hwnd();
    if let Some(state) = app.try_state::<CapturedFocus>() {
        if let Ok(mut guard) = state.0.lock() {
            *guard = hwnd;
        }
    }
    // Marca recording=true se for toggle e ainda não está marcado
    if let Some(state) = app.try_state::<HotkeyState>() {
        state.is_recording.store(true, Ordering::SeqCst);
    }
    if let Some(window) = app.get_webview_window("main") {
        let _ = crate::commands::show_pill(window);
    }
    let _ = app.emit(
        "dictation:start",
        StartPayload {
            source: "hotkey",
            mode: mode.as_str(),
            captured_hwnd: hwnd,
        },
    );
}

fn fire_stop<R: Runtime>(app: &AppHandle<R>) {
    if let Some(state) = app.try_state::<HotkeyState>() {
        state.is_recording.store(false, Ordering::SeqCst);
    }
    let _ = app.emit("dictation:stop", StopPayload {});
}

fn on_settings_pressed<R: Runtime>(app: &AppHandle<R>) {
    let Some(window) = app.get_webview_window("settings") else {
        eprintln!("[jarvstranscript] janela settings nao encontrada");
        return;
    };
    let _ = window.show();
    let _ = window.set_focus();
}

/// Chamado pelo frontend via command quando o VAD do backend encerra a sessão
/// no modo toggle — marca recording=false pra próximo press recomeçar.
pub fn note_external_stop<R: Runtime>(app: &AppHandle<R>) {
    if let Some(state) = app.try_state::<HotkeyState>() {
        state.is_recording.store(false, Ordering::SeqCst);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_hotkey_e_f8_puro() {
        assert_eq!(DEFAULT_HOTKEY, "F8");
    }

    #[test]
    fn settings_hotkey_segue_convencao_ctrl_alt() {
        assert!(SETTINGS_HOTKEY.contains("Alt"));
        assert!(SETTINGS_HOTKEY.ends_with("S"));
        assert!(!SETTINGS_HOTKEY.contains("Shift"));
    }

    #[test]
    fn captured_focus_inicia_vazio() {
        let cf = CapturedFocus::default();
        assert!(cf.0.lock().unwrap().is_none());
    }

    #[test]
    fn captured_focus_armazena_e_le_hwnd() {
        let cf = CapturedFocus::default();
        *cf.0.lock().unwrap() = Some(1234);
        assert_eq!(*cf.0.lock().unwrap(), Some(1234));
    }

    #[test]
    fn hotkey_mode_parsing() {
        assert_eq!(HotkeyMode::from_str("ptt").unwrap(), HotkeyMode::Ptt);
        assert_eq!(HotkeyMode::from_str("PTT").unwrap(), HotkeyMode::Ptt);
        assert_eq!(HotkeyMode::from_str(" hold ").unwrap(), HotkeyMode::Ptt);
        assert_eq!(HotkeyMode::from_str("toggle").unwrap(), HotkeyMode::Toggle);
        assert_eq!(HotkeyMode::from_str("Toggle").unwrap(), HotkeyMode::Toggle);
        assert_eq!(HotkeyMode::from_str("tog").unwrap(), HotkeyMode::Toggle);
        assert!(HotkeyMode::from_str("banana").is_err());
    }

    #[test]
    fn hotkey_mode_as_str() {
        assert_eq!(HotkeyMode::Ptt.as_str(), "ptt");
        assert_eq!(HotkeyMode::Toggle.as_str(), "toggle");
    }

    #[test]
    fn hotkey_state_init() {
        let s = HotkeyState::new(HotkeyMode::Toggle);
        assert_eq!(s.mode(), HotkeyMode::Toggle);
        assert!(!s.is_recording.load(Ordering::SeqCst));
    }

    #[test]
    fn hotkey_state_set_mode_atualiza_em_memoria() {
        let s = HotkeyState::new(HotkeyMode::Ptt);
        assert_eq!(s.mode(), HotkeyMode::Ptt);
        s.set_mode(HotkeyMode::Toggle);
        assert_eq!(s.mode(), HotkeyMode::Toggle);
        s.set_mode(HotkeyMode::Ptt);
        assert_eq!(s.mode(), HotkeyMode::Ptt);
    }

    #[test]
    fn hotkey_state_toggle_simula_press() {
        // Simula o fetch_xor que on_pressed faz no modo toggle
        let s = HotkeyState::new(HotkeyMode::Toggle);
        let prev1 = s.is_recording.fetch_xor(true, Ordering::SeqCst);
        assert!(!prev1, "primeiro press: estava parado");
        assert!(s.is_recording.load(Ordering::SeqCst));
        let prev2 = s.is_recording.fetch_xor(true, Ordering::SeqCst);
        assert!(prev2, "segundo press: estava gravando");
        assert!(!s.is_recording.load(Ordering::SeqCst));
    }

    #[test]
    fn mode_from_env_sem_var_usa_default() {
        std::env::remove_var("JARVSTRANSCRIPT_MODE");
        assert_eq!(mode_from_env(), HotkeyMode::Ptt);
    }

    #[test]
    fn mode_from_env_valor_invalido_usa_default() {
        std::env::set_var("JARVSTRANSCRIPT_MODE", "voar");
        assert_eq!(mode_from_env(), HotkeyMode::Ptt);
        std::env::remove_var("JARVSTRANSCRIPT_MODE");
    }

    #[test]
    fn mode_from_config_file_le_toggle() {
        let tmp = std::env::temp_dir().join(format!("jt-config-{}.json", std::process::id()));
        std::fs::write(&tmp, r#"{"mode": "toggle", "model": "tiny"}"#).unwrap();
        assert_eq!(mode_from_config_file(&tmp), Some(HotkeyMode::Toggle));
        std::fs::remove_file(&tmp).ok();
    }

    #[test]
    fn mode_from_config_file_arquivo_ausente_devolve_none() {
        let nope = std::path::Path::new("z:/nao/existe/config.json");
        assert_eq!(mode_from_config_file(nope), None);
    }

    #[test]
    fn mode_from_config_file_json_invalido_devolve_none() {
        let tmp = std::env::temp_dir().join(format!("jt-bad-{}.json", std::process::id()));
        std::fs::write(&tmp, "nao e json {").unwrap();
        assert_eq!(mode_from_config_file(&tmp), None);
        std::fs::remove_file(&tmp).ok();
    }
}
