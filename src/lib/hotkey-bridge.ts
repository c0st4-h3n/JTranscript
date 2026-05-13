/**
 * Bridge pura entre Tauri events (`dictation:start`/`dictation:stop`) e
 * callbacks da UI. `listen` é injetada — produção usa `@tauri-apps/api/event`,
 * testes usam fake.
 *
 * Hook React fica em `hooks/useHotkeyEvents.ts` consumindo este módulo.
 */

export interface HotkeyStartPayload {
  source: string;
  captured_hwnd: number | null;
}

export interface HotkeyHandlers {
  onStart: (payload: HotkeyStartPayload) => void;
  onStop: () => void;
}

export type UnlistenFn = () => void;

export type ListenFn = <T>(
  event: string,
  cb: (event: { payload: T }) => void,
) => Promise<UnlistenFn>;

export interface HotkeyBridge {
  dispose: () => Promise<void>;
  /** Promise que resolve quando os listeners estão prontos — útil pra testes. */
  ready: Promise<void>;
}

export function attachHotkeyBridge(listen: ListenFn, handlers: HotkeyHandlers): HotkeyBridge {
  let unlistenStart: UnlistenFn | null = null;
  let unlistenStop: UnlistenFn | null = null;
  let disposed = false;

  const ready = (async () => {
    const s = await listen<HotkeyStartPayload>("dictation:start", (e) => {
      if (!disposed) handlers.onStart(e.payload);
    });
    if (disposed) {
      s();
    } else {
      unlistenStart = s;
    }

    const t = await listen<unknown>("dictation:stop", () => {
      if (!disposed) handlers.onStop();
    });
    if (disposed) {
      t();
    } else {
      unlistenStop = t;
    }
  })();

  return {
    ready,
    dispose: async () => {
      disposed = true;
      await ready.catch(() => {
        // ignora — listen pode falhar sem Tauri context
      });
      unlistenStart?.();
      unlistenStop?.();
    },
  };
}
