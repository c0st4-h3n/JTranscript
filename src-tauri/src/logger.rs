//! Logger em arquivo — escreve em `%LOCALAPPDATA%\JarvsTranscript\shell.log`
//! quando rodando do MSI install (sem console). Em dev (cargo tauri dev),
//! também imprime no stderr.
//!
//! Sem deps externas. `OnceLock` segura o path resolvido no setup do app.

use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::OnceLock;

static LOG_PATH: OnceLock<PathBuf> = OnceLock::new();

/// Configura o caminho do arquivo de log. Idempotente — só seta uma vez.
/// Caller deve chamar no `setup()` do Tauri Builder.
pub fn init(path: PathBuf) {
    let _ = LOG_PATH.set(path);
}

/// Loga uma mensagem em stderr E no arquivo (se configurado).
pub fn log(msg: &str) {
    eprintln!("{msg}");
    let Some(path) = LOG_PATH.get() else {
        return;
    };
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(path) {
        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let _ = writeln!(f, "[ts={ts}] {msg}");
    }
}

/// Macro pra logar com format!() sem alocar quando logger nao tá pronto.
#[macro_export]
macro_rules! log_event {
    ($($arg:tt)*) => {{
        $crate::logger::log(&format!($($arg)*));
    }};
}
