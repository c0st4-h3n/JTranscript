import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import { MicRecorder, type RecorderState } from "./audio/recorder";
import { createWebAudioCaptureTransport } from "./audio/web-audio-transport";
import { type PasteState, Pill, type PillVisualState } from "./components/Pill";
import { useHotkeyEvents } from "./hooks/useHotkeyEvents";
import {
  DictationSocket,
  type DictationState,
  type FinalEvent,
  type PartialEvent,
  type ServerError,
} from "./lib/dictation-socket";
import { browserWebSocketTransport } from "./lib/ws-transport";

interface InsertReport {
  outcome: "paste" | "fallback";
  focus_restored: boolean;
  captured_hwnd: number | null;
}

type SessionMode = "ptt" | "toggle";

function normalizeMode(raw: string | undefined): SessionMode {
  return raw === "toggle" ? "toggle" : "ptt";
}

const BACKEND_URL = "ws://127.0.0.1:7979";
const HIDE_AFTER_PASTE_MS = 1400;
const HIDE_AFTER_ERROR_MS = 3500;

/** Debug log que vai pro shell.log via invoke Tauri. No-op em browser puro. */
function trace(msg: string): void {
  invoke("log_event", { msg }).catch(() => {});
}

export function App() {
  const [sockState, setSockState] = useState<DictationState>({ kind: "idle" });
  const [recState, setRecState] = useState<RecorderState>({ kind: "idle" });
  const [level, setLevel] = useState(0);
  const [lastPartial, setLastPartial] = useState<PartialEvent | null>(null);
  const [final, setFinal] = useState<FinalEvent | null>(null);
  const [serverErr, setServerErr] = useState<ServerError | null>(null);
  const [paste, setPaste] = useState<PasteState>({ kind: "idle" });
  const [currentMode, setCurrentMode] = useState<SessionMode>("ptt");

  const socketRef = useRef<DictationSocket | null>(null);
  const recorderRef = useRef<MicRecorder | null>(null);
  // ref espelhada pra handleStart ler valor atual sem closure stale
  const currentModeRef = useRef<SessionMode>("ptt");
  currentModeRef.current = currentMode;

  useEffect(() => {
    const socket = new DictationSocket(BACKEND_URL, browserWebSocketTransport);
    socketRef.current = socket;

    trace("App boot — criando DictationSocket");
    const unsubState = socket.subscribe((s) => {
      setSockState(s);
      trace(`sock state: ${s.kind}${s.kind === "connected" ? ` model=${s.model} gpu=${s.gpu}` : ""}${s.kind === "error" ? ` msg=${s.message}` : ""}`);
    });
    const unsubPartial = socket.onPartial((p) => setLastPartial(p));
    const unsubFinal = socket.onFinal(async (f) => {
      setFinal(f);
      // Backend encerrou sozinho (VAD no modo toggle) → para o recorder e
      // sincroniza o estado da hotkey no Rust pra próximo press recomeçar.
      if (f.autoEnded) {
        try {
          await recorder.stop();
        } catch {
          // ignora
        }
        invoke("note_auto_stop").catch(() => {
          // sem Tauri context — ok
        });
      }

      const text = (f.textPolished ?? f.textRaw).trim();
      if (!text) {
        scheduleHide(HIDE_AFTER_PASTE_MS);
        return;
      }
      setPaste({ kind: "pasting" });
      try {
        const report = await invoke<InsertReport>("insert_text", { text });
        setPaste({
          kind: "ok",
          outcome: report.outcome,
          focusRestored: report.focus_restored,
        });
      } catch (e) {
        setPaste({
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
        });
      }
      scheduleHide(HIDE_AFTER_PASTE_MS);
    });
    const unsubErr = socket.onServerError((e) => {
      setServerErr(e);
      scheduleHide(HIDE_AFTER_ERROR_MS);
    });

    // Sincroniza o mode inicial do disco e ajusta o Rust pra refletir.
    const applyMode = (mode: string) => {
      const m = normalizeMode(mode);
      setCurrentMode(m);
      invoke("set_hotkey_mode", { mode: m }).catch(() => {
        // sem Tauri context (vite dev em browser) — ok
      });
    };
    const unsubConfig = socket.onConfig((s) => applyMode(s.mode));
    const unsubConfigApplied = socket.onConfigApplied((e) => applyMode(e.settings.mode));

    // Retry connect com backoff — backend.exe pode levar 2-5s pra Whisper
    // subir após o shell. Sem retry, sock fica "error" e qualquer F8 falha.
    let cancelled = false;
    const connectWithRetry = async (): Promise<void> => {
      let delay = 500;
      const maxDelay = 4000;
      const giveUpAfterMs = 60_000;
      const startedAt = Date.now();
      while (!cancelled) {
        try {
          await socket.connect();
          trace("WS connect OK");
          try {
            socket.sendGetConfig();
          } catch {
            // race entre connect resolve e sendGetConfig — ok
          }
          return;
        } catch (e) {
          if (Date.now() - startedAt > giveUpAfterMs) {
            trace(`WS connect desistiu apos ${giveUpAfterMs}ms: ${e instanceof Error ? e.message : String(e)}`);
            return;
          }
          trace(`WS connect falhou, retry em ${delay}ms: ${e instanceof Error ? e.message : String(e)}`);
          await new Promise((r) => setTimeout(r, delay));
          delay = Math.min(maxDelay, Math.round(delay * 1.5));
        }
      }
    };
    void connectWithRetry();

    const recorder = new MicRecorder(createWebAudioCaptureTransport);
    recorderRef.current = recorder;
    const unsubRec = recorder.subscribe(setRecState);
    const unsubLevel = recorder.onLevel(setLevel);
    const unsubChunk = recorder.onChunk(({ data, seq }) => {
      try {
        socket.sendAudioChunk(data, seq);
      } catch {
        // socket nao conectado
      }
    });

    return () => {
      cancelled = true;
      unsubState();
      unsubPartial();
      unsubFinal();
      unsubErr();
      unsubConfig();
      unsubConfigApplied();
      unsubRec();
      unsubLevel();
      unsubChunk();
      recorder.stop().catch(() => {});
      socket.close();
    };
  }, []);

  const handleStart = async () => {
    setLastPartial(null);
    setFinal(null);
    setServerErr(null);
    setPaste({ kind: "idle" });
    trace(`handleStart — mode=${currentModeRef.current} sock=${socketRef.current ? "alive" : "null"}`);
    try {
      socketRef.current?.sendSessionStart({
        mode: currentModeRef.current,
        polish: true,
        lang: "pt",
      });
      trace("sendSessionStart OK");
    } catch (e) {
      trace(`sendSessionStart FAILED: ${e instanceof Error ? e.message : String(e)}`);
    }
    try {
      await recorderRef.current?.start();
      trace("recorder.start OK");
    } catch (e) {
      trace(`recorder.start FAILED: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleStop = async () => {
    trace("handleStop");
    await recorderRef.current?.stop();
    try {
      socketRef.current?.sendSessionEnd();
      trace("sendSessionEnd OK");
    } catch (e) {
      trace(`sendSessionEnd FAILED: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  useHotkeyEvents({
    onStart: () => {
      trace("hotkey:start recebido");
      void handleStart();
    },
    onStop: () => {
      trace("hotkey:stop recebido");
      void handleStop();
    },
  });

  const visual = computeVisualState({
    recState,
    level,
    final,
    paste,
    serverErr,
  });

  // CSP do Tauri pode bloquear navigation acidentais — desabilita contextmenu
  // dentro da pill pra UX limpa.
  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // Reservado: socket status no console pra debug — não polui a pill.
  useEffect(() => {
    if (sockState.kind === "error") {
      // eslint-disable-next-line no-console
      console.warn("[ws] erro de transporte:", sockState.message);
    }
  }, [sockState]);

  return <Pill state={visual} lastPartial={lastPartial} serverError={serverErr} />;
}

function computeVisualState(input: {
  recState: RecorderState;
  level: number;
  final: FinalEvent | null;
  paste: PasteState;
  serverErr: ServerError | null;
}): PillVisualState {
  const { recState, level, final, paste, serverErr } = input;
  if (serverErr) return { kind: "error", message: serverErr.message };
  if (recState.kind === "recording") {
    return {
      kind: "recording",
      chunksSent: recState.chunksSent,
      level,
    };
  }
  if (recState.kind === "stopped" && !final) {
    return { kind: "transcribing", level: 0 };
  }
  if (final) {
    return { kind: "final", final, paste };
  }
  return { kind: "idle" };
}

function scheduleHide(delayMs: number): void {
  setTimeout(() => {
    invoke("hide_pill").catch(() => {
      // sem Tauri context — ok
    });
  }, delayMs);
}
