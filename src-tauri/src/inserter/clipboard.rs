//! `ClipboardInserter` — caminho rápido: salva clipboard atual, seta texto,
//! manda `Ctrl+V` via enigo, restaura clipboard original após 200ms.
//!
//! Não armazena `arboard::Clipboard` (não é Send+Sync) — cria por chamada.

use std::thread;
use std::time::Duration;

use super::{InsertError, InsertOutcome, Inserter};

const PASTE_SETTLE_MS: u64 = 200;

#[derive(Default)]
pub struct ClipboardInserter;

impl ClipboardInserter {
    pub fn new() -> Self {
        Self
    }
}

impl Inserter for ClipboardInserter {
    fn insert(&self, text: &str) -> Result<InsertOutcome, InsertError> {
        if text.is_empty() {
            return Err(InsertError::EmptyText);
        }

        let mut clipboard = arboard::Clipboard::new()
            .map_err(|e| InsertError::SystemError(format!("clipboard init falhou: {e}")))?;

        // Salva conteúdo atual pra restaurar depois (best-effort).
        let original = clipboard.get_text().ok();

        clipboard
            .set_text(text.to_owned())
            .map_err(|e| InsertError::SystemError(format!("set clipboard falhou: {e}")))?;

        // Pequena espera pro clipboard manager registrar o set antes do Ctrl+V.
        thread::sleep(Duration::from_millis(15));

        let mut enigo = enigo::Enigo::new(&enigo::Settings::default())
            .map_err(|e| InsertError::SystemError(format!("enigo init falhou: {e}")))?;

        use enigo::{Direction, Key, Keyboard};

        let paste_result = (|| -> Result<(), enigo::InputError> {
            enigo.key(Key::Control, Direction::Press)?;
            enigo.key(Key::Unicode('v'), Direction::Click)?;
            enigo.key(Key::Control, Direction::Release)?;
            Ok(())
        })();

        // Aguarda o paste antes de restaurar.
        thread::sleep(Duration::from_millis(PASTE_SETTLE_MS));

        if let Some(orig) = original {
            // Best-effort — se falhar, o pior é o usuário perder o clipboard anterior.
            let _ = clipboard.set_text(orig);
        }

        paste_result
            .map(|_| InsertOutcome::Paste)
            .map_err(|e| InsertError::SystemError(format!("enigo paste falhou: {e}")))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn texto_vazio_devolve_empty_text_sem_tocar_no_clipboard() {
        let ins = ClipboardInserter::new();
        let err = ins.insert("").expect_err("vazio deveria falhar");
        assert_eq!(err, InsertError::EmptyText);
    }
}
