//! Captura/restaura HWND da janela em foco — Win32 puro.
//!
//! HWND é representado como `isize` na camada Rust pra atravessar safe boundaries
//! (não é Send por design, mas o handle bruto cabe num inteiro). Conversão pra
//! `HWND` real só acontece dentro do módulo `sys`, isolada.

#[cfg(windows)]
mod sys {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, IsWindow, SetForegroundWindow,
    };

    pub fn capture_active() -> Option<isize> {
        let hwnd = unsafe { GetForegroundWindow() };
        let bits = hwnd.0 as isize;
        if bits == 0 {
            None
        } else {
            Some(bits)
        }
    }

    pub fn is_valid(hwnd_bits: isize) -> bool {
        if hwnd_bits == 0 {
            return false;
        }
        let hwnd = HWND(hwnd_bits as *mut _);
        unsafe { IsWindow(hwnd).as_bool() }
    }

    pub fn restore(hwnd_bits: isize) -> bool {
        if !is_valid(hwnd_bits) {
            return false;
        }
        let hwnd = HWND(hwnd_bits as *mut _);
        unsafe { SetForegroundWindow(hwnd).as_bool() }
    }
}

#[cfg(not(windows))]
mod sys {
    pub fn capture_active() -> Option<isize> {
        None
    }
    pub fn is_valid(_: isize) -> bool {
        false
    }
    pub fn restore(_: isize) -> bool {
        false
    }
}

/// HWND da janela em foreground agora. `None` se não houver (ex: lock screen).
pub fn capture_active_hwnd() -> Option<isize> {
    sys::capture_active()
}

/// `true` se o HWND ainda é uma janela válida (a app pode ter fechado).
pub fn is_valid_hwnd(hwnd: isize) -> bool {
    sys::is_valid(hwnd)
}

/// Restaura o HWND como janela em foreground. `false` se UAC/sandbox bloquearam
/// `SetForegroundWindow` (limitação documentada do Windows).
pub fn restore_active_hwnd(hwnd: isize) -> bool {
    sys::restore(hwnd)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn capture_nao_panica() {
        // Em headless o resultado pode ser None — só garantimos que não panica.
        let _ = capture_active_hwnd();
    }

    #[test]
    fn hwnd_zero_nunca_e_valido() {
        assert!(!is_valid_hwnd(0));
    }

    #[test]
    fn restore_hwnd_zero_falha_sem_panicar() {
        assert!(!restore_active_hwnd(0));
    }
}
