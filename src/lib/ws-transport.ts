/**
 * Adapter Transport sobre WebSocket nativo do navegador.
 *
 * Mantém o `DictationSocket` testável: a classe não toca `WebSocket` direto.
 */

import type { Transport, TransportFactory } from "./dictation-socket";

export const browserWebSocketTransport: TransportFactory = (url) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const onOpenErr = (e: Event) => {
      reject(new Error(`falha ao conectar em ${url}: ${e.type}`));
    };
    ws.addEventListener("open", () => {
      ws.removeEventListener("error", onOpenErr);
      resolve(wrap(ws));
    });
    ws.addEventListener("error", onOpenErr, { once: true });
  });
};

function wrap(ws: WebSocket): Transport {
  let msgCb: ((m: unknown) => void) | null = null;
  let errCb: ((e: Error) => void) | null = null;
  let closeCb: (() => void) | null = null;

  ws.addEventListener("message", (e) => {
    if (!msgCb) return;
    try {
      msgCb(JSON.parse(typeof e.data === "string" ? e.data : ""));
    } catch {
      errCb?.(new Error("payload nao-json recebido do backend"));
    }
  });
  ws.addEventListener("error", () => {
    errCb?.(new Error("erro no websocket"));
  });
  ws.addEventListener("close", () => {
    closeCb?.();
  });

  return {
    send: (payload) => ws.send(JSON.stringify(payload)),
    close: () => ws.close(),
    onMessage: (cb) => {
      msgCb = cb;
    },
    onError: (cb) => {
      errCb = cb;
    },
    onClose: (cb) => {
      closeCb = cb;
    },
  };
}
