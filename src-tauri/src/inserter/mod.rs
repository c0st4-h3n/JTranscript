//! Inserter — trait + implementações pra colar texto no app focado.
//!
//! Estratégia híbrida (ver ADR 0003): `ClipboardInserter` rápido como padrão,
//! `SendInputInserter` como fallback. `HybridInserter` orquestra os dois.
//! `FakeInserter` é a versão de teste, captura tudo em memória.

use std::sync::Mutex;

pub mod clipboard;
pub mod hybrid;
pub mod sendinput;

pub use clipboard::ClipboardInserter;
pub use hybrid::HybridInserter;
pub use sendinput::SendInputInserter;

/// Resultado de uma inserção bem-sucedida.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InsertOutcome {
    /// Clipboard paste rolou — caminho rápido.
    Paste,
    /// Fallback SendInput foi acionado.
    Fallback,
}

/// Erro de inserção. Mensagens em PT-BR curto.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum InsertError {
    /// Texto vazio — nada a colar.
    EmptyText,
    /// Falha de sistema (clipboard travado, foco perdido, enigo, etc.).
    SystemError(String),
}

impl std::fmt::Display for InsertError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::EmptyText => f.write_str("texto vazio"),
            Self::SystemError(msg) => write!(f, "erro de sistema: {msg}"),
        }
    }
}

impl std::error::Error for InsertError {}

/// Porta da Clean Architecture: quem coloca texto no app focado.
pub trait Inserter: Send + Sync {
    fn insert(&self, text: &str) -> Result<InsertOutcome, InsertError>;
}

/// Inserter de teste — captura tudo em memória, sem mexer no sistema.
pub struct FakeInserter {
    captured: Mutex<Vec<String>>,
    outcome: InsertOutcome,
    fail_with: Option<InsertError>,
}

impl FakeInserter {
    pub fn paste_ok() -> Self {
        Self {
            captured: Mutex::new(Vec::new()),
            outcome: InsertOutcome::Paste,
            fail_with: None,
        }
    }

    pub fn fallback_ok() -> Self {
        Self {
            captured: Mutex::new(Vec::new()),
            outcome: InsertOutcome::Fallback,
            fail_with: None,
        }
    }

    pub fn failing(err: InsertError) -> Self {
        Self {
            captured: Mutex::new(Vec::new()),
            outcome: InsertOutcome::Paste,
            fail_with: Some(err),
        }
    }

    pub fn captured(&self) -> Vec<String> {
        self.captured.lock().expect("mutex envenenado").clone()
    }
}

impl Inserter for FakeInserter {
    fn insert(&self, text: &str) -> Result<InsertOutcome, InsertError> {
        if text.is_empty() {
            return Err(InsertError::EmptyText);
        }
        if let Some(err) = &self.fail_with {
            return Err(err.clone());
        }
        self.captured
            .lock()
            .expect("mutex envenenado")
            .push(text.to_owned());
        Ok(self.outcome)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fake_paste_captura_texto_e_retorna_paste() {
        let ins = FakeInserter::paste_ok();
        let out = ins.insert("olá mundo").expect("deve passar");
        assert_eq!(out, InsertOutcome::Paste);
        assert_eq!(ins.captured(), vec!["olá mundo".to_string()]);
    }

    #[test]
    fn fake_fallback_marca_outcome_correto() {
        let ins = FakeInserter::fallback_ok();
        let out = ins.insert("teste ção ã é").expect("deve passar");
        assert_eq!(out, InsertOutcome::Fallback);
    }

    #[test]
    fn texto_vazio_devolve_empty_text() {
        let ins = FakeInserter::paste_ok();
        let err = ins.insert("").expect_err("vazio deveria falhar");
        assert_eq!(err, InsertError::EmptyText);
        assert!(ins.captured().is_empty());
    }

    #[test]
    fn falha_simulada_nao_captura() {
        let ins = FakeInserter::failing(InsertError::SystemError("foco perdido".into()));
        let err = ins.insert("qualquer").expect_err("deveria falhar");
        match err {
            InsertError::SystemError(msg) => assert_eq!(msg, "foco perdido"),
            other => panic!("erro inesperado: {other:?}"),
        }
        assert!(ins.captured().is_empty());
    }

    #[test]
    fn insert_error_display_em_ptbr() {
        assert_eq!(InsertError::EmptyText.to_string(), "texto vazio");
        assert_eq!(
            InsertError::SystemError("clipboard travado".into()).to_string(),
            "erro de sistema: clipboard travado"
        );
    }
}
