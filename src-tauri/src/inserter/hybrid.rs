//! `HybridInserter` — tenta primary (clipboard); se falhar com erro de sistema,
//! cai pro fallback (sendinput). Texto vazio é rejeitado direto.
//!
//! Testável com `FakeInserter` injetado em ambos os papéis (`super::FakeInserter`).
//!
//! Blocklist por process name (ex: forçar sendinput em `mintty.exe`) entra na
//! Fase 9 quando o sistema de settings nascer — por ora, é só "primary -> fallback".

use std::sync::Arc;

use super::{InsertError, InsertOutcome, Inserter};

pub struct HybridInserter {
    primary: Arc<dyn Inserter>,
    fallback: Arc<dyn Inserter>,
}

impl HybridInserter {
    pub fn new(primary: Arc<dyn Inserter>, fallback: Arc<dyn Inserter>) -> Self {
        Self { primary, fallback }
    }
}

impl Inserter for HybridInserter {
    fn insert(&self, text: &str) -> Result<InsertOutcome, InsertError> {
        if text.is_empty() {
            return Err(InsertError::EmptyText);
        }
        match self.primary.insert(text) {
            Ok(outcome) => Ok(outcome),
            Err(InsertError::EmptyText) => Err(InsertError::EmptyText),
            Err(InsertError::SystemError(_)) => self.fallback.insert(text),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::super::FakeInserter;
    use super::*;

    #[test]
    fn primary_sucesso_nao_chama_fallback() {
        let primary = Arc::new(FakeInserter::paste_ok());
        let fallback = Arc::new(FakeInserter::fallback_ok());
        let hybrid = HybridInserter::new(primary.clone(), fallback.clone());
        let out = hybrid.insert("texto").expect("deveria passar");
        assert_eq!(out, InsertOutcome::Paste);
        assert_eq!(primary.captured(), vec!["texto".to_string()]);
        assert!(fallback.captured().is_empty());
    }

    #[test]
    fn primary_falha_aciona_fallback() {
        let primary = Arc::new(FakeInserter::failing(InsertError::SystemError(
            "clipboard travado".into(),
        )));
        let fallback = Arc::new(FakeInserter::fallback_ok());
        let hybrid = HybridInserter::new(primary.clone(), fallback.clone());
        let out = hybrid.insert("oi").expect("fallback deveria passar");
        assert_eq!(out, InsertOutcome::Fallback);
        assert!(primary.captured().is_empty()); // FakeInserter::failing nao captura
        assert_eq!(fallback.captured(), vec!["oi".to_string()]);
    }

    #[test]
    fn fallback_tambem_falha_propaga_erro() {
        let primary = Arc::new(FakeInserter::failing(InsertError::SystemError(
            "clipboard travado".into(),
        )));
        let fallback = Arc::new(FakeInserter::failing(InsertError::SystemError(
            "sendinput bloqueado".into(),
        )));
        let hybrid = HybridInserter::new(primary, fallback);
        let err = hybrid.insert("oi").expect_err("nada deveria passar");
        match err {
            InsertError::SystemError(msg) => assert_eq!(msg, "sendinput bloqueado"),
            other => panic!("erro inesperado: {other:?}"),
        }
    }

    #[test]
    fn texto_vazio_devolve_empty_sem_chamar_ninguem() {
        let primary = Arc::new(FakeInserter::paste_ok());
        let fallback = Arc::new(FakeInserter::fallback_ok());
        let hybrid = HybridInserter::new(primary.clone(), fallback.clone());
        let err = hybrid.insert("").expect_err("vazio deveria falhar");
        assert_eq!(err, InsertError::EmptyText);
        assert!(primary.captured().is_empty());
        assert!(fallback.captured().is_empty());
    }
}
