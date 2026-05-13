//! `SendInputInserter` — fallback que digita o texto caractere a caractere via
//! `enigo::Keyboard::text()`. Funciona em apps "refratárias" ao clipboard paste
//! (mintty, terminais Linux-like no Windows), com custo de latência maior
//! (~50 keystrokes/s).

use super::{InsertError, InsertOutcome, Inserter};

#[derive(Default)]
pub struct SendInputInserter;

impl SendInputInserter {
    pub fn new() -> Self {
        Self
    }
}

impl Inserter for SendInputInserter {
    fn insert(&self, text: &str) -> Result<InsertOutcome, InsertError> {
        if text.is_empty() {
            return Err(InsertError::EmptyText);
        }

        let mut enigo = enigo::Enigo::new(&enigo::Settings::default())
            .map_err(|e| InsertError::SystemError(format!("enigo init falhou: {e}")))?;

        use enigo::Keyboard;
        enigo
            .text(text)
            .map_err(|e| InsertError::SystemError(format!("sendinput text falhou: {e}")))?;

        Ok(InsertOutcome::Fallback)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn texto_vazio_devolve_empty_text() {
        let ins = SendInputInserter::new();
        let err = ins.insert("").expect_err("vazio deveria falhar");
        assert_eq!(err, InsertError::EmptyText);
    }
}
