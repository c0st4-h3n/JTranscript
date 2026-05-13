import { describe, expect, it, vi } from "vitest";
import {
  attachHotkeyBridge,
  type HotkeyStartPayload,
  type ListenFn,
} from "./hotkey-bridge";

type Pending = { event: string; cb: (e: { payload: unknown }) => void; unlisten: () => void };

function makeFakeListen(): { listen: ListenFn; pending: Pending[]; emit: (event: string, payload: unknown) => void } {
  const pending: Pending[] = [];
  const listen: ListenFn = async (event, cb) => {
    const unlisten = vi.fn();
    pending.push({ event, cb: cb as Pending["cb"], unlisten });
    return unlisten;
  };
  const emit = (event: string, payload: unknown) => {
    for (const p of pending) {
      if (p.event === event) p.cb({ payload });
    }
  };
  return { listen, pending, emit };
}

describe("attachHotkeyBridge", () => {
  it("registra listeners pra dictation:start e dictation:stop", async () => {
    const { listen, pending } = makeFakeListen();
    const bridge = attachHotkeyBridge(listen, {
      onStart: () => {},
      onStop: () => {},
    });
    await bridge.ready;
    expect(pending.map((p) => p.event)).toEqual(["dictation:start", "dictation:stop"]);
  });

  it("emit dictation:start dispara onStart com payload", async () => {
    const { listen, emit } = makeFakeListen();
    const onStart = vi.fn();
    const bridge = attachHotkeyBridge(listen, { onStart, onStop: () => {} });
    await bridge.ready;

    const payload: HotkeyStartPayload = { source: "hotkey", captured_hwnd: 12345 };
    emit("dictation:start", payload);

    expect(onStart).toHaveBeenCalledWith(payload);
  });

  it("emit dictation:stop dispara onStop sem args", async () => {
    const { listen, emit } = makeFakeListen();
    const onStop = vi.fn();
    const bridge = attachHotkeyBridge(listen, { onStart: () => {}, onStop });
    await bridge.ready;

    emit("dictation:stop", undefined);

    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledWith();
  });

  it("dispose chama unlisten dos dois eventos", async () => {
    const { listen, pending } = makeFakeListen();
    const bridge = attachHotkeyBridge(listen, { onStart: () => {}, onStop: () => {} });
    await bridge.ready;
    await bridge.dispose();
    for (const p of pending) {
      expect(p.unlisten).toHaveBeenCalled();
    }
  });

  it("dispose antes do ready ainda limpa os listeners quando resolverem", async () => {
    const { listen, pending } = makeFakeListen();
    const bridge = attachHotkeyBridge(listen, { onStart: () => {}, onStop: () => {} });
    await bridge.dispose(); // sem await no ready

    // Cada listen que entrou apos dispose deveria ter sido auto-unsubscrito.
    for (const p of pending) {
      expect(p.unlisten).toHaveBeenCalled();
    }
  });

  it("eventos depois de dispose nao disparam mais handlers", async () => {
    const { listen, emit } = makeFakeListen();
    const onStart = vi.fn();
    const onStop = vi.fn();
    const bridge = attachHotkeyBridge(listen, { onStart, onStop });
    await bridge.ready;
    await bridge.dispose();

    emit("dictation:start", { source: "hotkey", captured_hwnd: null });
    emit("dictation:stop", undefined);

    expect(onStart).not.toHaveBeenCalled();
    expect(onStop).not.toHaveBeenCalled();
  });

  it("listen falhando nao explode a chamada — dispose continua seguro", async () => {
    const failing: ListenFn = async () => {
      throw new Error("sem tauri context");
    };
    const bridge = attachHotkeyBridge(failing, { onStart: () => {}, onStop: () => {} });
    await expect(bridge.dispose()).resolves.toBeUndefined();
  });
});
