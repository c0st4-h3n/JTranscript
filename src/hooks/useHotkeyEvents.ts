import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import {
  attachHotkeyBridge,
  type HotkeyHandlers,
  type HotkeyStartPayload,
  type ListenFn,
} from "../lib/hotkey-bridge";

const tauriListen: ListenFn = (event, cb) =>
  listen(event, (e) => cb({ payload: e.payload as never }));

/**
 * Escuta `dictation:start` e `dictation:stop` emitidos pelo backend Rust
 * (hotkey global). Os handlers são guardados em ref pra evitar reinscrever
 * a cada render — só monta/desmonta uma vez.
 */
export function useHotkeyEvents(handlers: HotkeyHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const bridge = attachHotkeyBridge(tauriListen, {
      onStart: (p: HotkeyStartPayload) => ref.current.onStart(p),
      onStop: () => ref.current.onStop(),
    });
    return () => {
      void bridge.dispose();
    };
  }, []);
}
