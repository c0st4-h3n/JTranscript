import { describe, expect, it } from "vitest";
import {
  type ConfigAppliedEvent,
  DictationSocket,
  type DictationState,
  type FinalEvent,
  type PartialEvent,
  type ServerError,
  type SettingsSnapshot,
  type Transport,
} from "./dictation-socket";

type FakeTransport = Transport & {
  emit(msg: unknown): void;
  fail(err: Error): void;
  hangup(): void;
  sent: unknown[];
  closed: boolean;
};

function makeFakeTransport(): FakeTransport {
  const sent: unknown[] = [];
  let msgCb: ((m: unknown) => void) | null = null;
  let errCb: ((e: Error) => void) | null = null;
  let closeCb: (() => void) | null = null;
  const t: FakeTransport = {
    sent,
    closed: false,
    send: (p) => {
      sent.push(p);
    },
    close: () => {
      t.closed = true;
    },
    onMessage: (cb) => {
      msgCb = cb;
    },
    onError: (cb) => {
      errCb = cb;
    },
    onClose: (cb) => {
      closeCb = cb;
    },
    emit: (m) => msgCb?.(m),
    fail: (e) => errCb?.(e),
    hangup: () => closeCb?.(),
  };
  return t;
}

describe("DictationSocket — conexão e estado", () => {
  it("inicia em estado idle", () => {
    const sock = new DictationSocket("ws://test", async () => makeFakeTransport());
    expect(sock.getState()).toEqual({ kind: "idle" });
  });

  it("transiciona idle -> connecting -> connected ao receber ready", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    const log: DictationState["kind"][] = [];
    sock.subscribe((s) => log.push(s.kind));

    await sock.connect();
    fake.emit({
      type: "ready",
      protocol_version: 1,
      model: "whisper-large-v3-turbo",
      gpu: true,
    });

    const state = sock.getState();
    expect(state.kind).toBe("connected");
    if (state.kind === "connected") {
      expect(state.protocolVersion).toBe(1);
      expect(state.gpu).toBe(true);
      expect(state.model).toBe("whisper-large-v3-turbo");
    }
    expect(log).toEqual(["idle", "connecting", "connected"]);
  });

  it("falha de transporte vai pro estado error", async () => {
    const sock = new DictationSocket(
      "ws://test",
      async () => {
        throw new Error("conexao recusada");
      },
    );
    await expect(sock.connect()).rejects.toThrow("conexao recusada");
    expect(sock.getState()).toEqual({ kind: "error", message: "conexao recusada" });
  });

  it("ignora mensagens sem campo type", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    fake.emit({ foo: "bar" });
    expect(sock.getState().kind).toBe("connecting");
  });
});

describe("DictationSocket — envios cliente -> servidor", () => {
  it("ping envia { type: ping }", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    sock.ping();
    expect(fake.sent).toEqual([{ type: "ping" }]);
  });

  it("envio antes de connect() explode com erro claro", () => {
    const sock = new DictationSocket("ws://test", async () => makeFakeTransport());
    expect(() => sock.ping()).toThrowError(/antes de connect/);
    expect(() => sock.sendAudioChunk("AAAA", 1)).toThrowError(/antes de connect/);
    expect(() => sock.sendSessionEnd()).toThrowError(/antes de connect/);
  });

  it("sendSessionStart envia payload completo do protocolo", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    sock.sendSessionStart({ mode: "ptt", polish: true, lang: "pt" });
    expect(fake.sent).toEqual([
      { type: "session_start", mode: "ptt", polish: true, lang: "pt" },
    ]);
  });

  it("sendAudioChunk preserva data e seq exatamente", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    sock.sendAudioChunk("AACAPw==", 1);
    sock.sendAudioChunk("AACAvw==", 2);
    expect(fake.sent).toEqual([
      { type: "audio_chunk", data: "AACAPw==", seq: 1 },
      { type: "audio_chunk", data: "AACAvw==", seq: 2 },
    ]);
  });

  it("sendSessionEnd e sendCancel sao payloads minimos", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    sock.sendSessionEnd();
    sock.sendCancel();
    expect(fake.sent).toEqual([{ type: "session_end" }, { type: "cancel" }]);
  });
});

describe("DictationSocket — eventos servidor -> cliente", () => {
  it("partial dispara onPartial e nao toca o estado", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    fake.emit({ type: "ready", protocol_version: 1, model: "tiny", gpu: true });

    const recv: PartialEvent[] = [];
    sock.onPartial((p) => recv.push(p));

    fake.emit({
      type: "partial",
      text: "olá",
      confidence: 0.85,
      latency_ms: 187,
      seq: 3,
    });

    expect(recv).toHaveLength(1);
    expect(recv[0]).toEqual({
      text: "olá",
      confidence: 0.85,
      latencyMs: 187,
      seq: 3,
    });
    expect(sock.getState().kind).toBe("connected");
  });

  it("final dispara onFinal com snake_case mapeado pra camelCase", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    fake.emit({ type: "ready" });

    const recv: FinalEvent[] = [];
    sock.onFinal((f) => recv.push(f));

    fake.emit({
      type: "final",
      text_raw: "olá mundo",
      text_polished: "Olá, mundo.",
      polish_applied: true,
      latency_ms: 412,
      auto_ended: false,
    });

    expect(recv).toHaveLength(1);
    expect(recv[0]).toEqual({
      textRaw: "olá mundo",
      textPolished: "Olá, mundo.",
      polishApplied: true,
      latencyMs: 412,
      autoEnded: false,
    });
  });

  it("final com auto_ended=true vira autoEnded=true no FinalEvent", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    fake.emit({ type: "ready" });

    const recv: FinalEvent[] = [];
    sock.onFinal((f) => recv.push(f));

    fake.emit({
      type: "final",
      text_raw: "olá",
      text_polished: null,
      polish_applied: false,
      latency_ms: 200,
      auto_ended: true,
    });

    expect(recv).toHaveLength(1);
    expect(recv[0]!.autoEnded).toBe(true);
  });

  it("final sem auto_ended (legado) defaulta pra false", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    fake.emit({ type: "ready" });
    const recv: FinalEvent[] = [];
    sock.onFinal((f) => recv.push(f));
    fake.emit({ type: "final", text_raw: "x" });
    expect(recv[0]!.autoEnded).toBe(false);
  });

  it("error do servidor dispara onServerError sem virar estado error", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    fake.emit({ type: "ready" });

    const errs: ServerError[] = [];
    sock.onServerError((e) => errs.push(e));

    fake.emit({
      type: "error",
      code: "polish_timeout",
      message: "qwen demorou demais",
    });

    expect(errs).toEqual([{ code: "polish_timeout", message: "qwen demorou demais" }]);
    // estado segue connected — erro do servidor e recuperavel
    expect(sock.getState().kind).toBe("connected");
  });

  it("close() encerra o transport", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    sock.close();
    expect(fake.closed).toBe(true);
  });

  it("unsubscribe de onPartial remove o listener", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    const recv: PartialEvent[] = [];
    const off = sock.onPartial((p) => recv.push(p));
    fake.emit({ type: "partial", text: "a" });
    off();
    fake.emit({ type: "partial", text: "b" });
    expect(recv.map((p) => p.text)).toEqual(["a"]);
  });
});

describe("DictationSocket — config (get/set)", () => {
  const SAMPLE_SETTINGS: SettingsSnapshot = {
    version: 1,
    model: "tiny",
    device: "auto",
    language: "pt",
    mode: "ptt",
    vad: "silero",
    silence_to_end_ms: 3000,
    polish_enabled: false,
    hotkey: "F8",
    blocklist_apps: ["mintty.exe"],
  };

  it("sendGetConfig manda { type: get_config }", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    sock.sendGetConfig();
    expect(fake.sent).toEqual([{ type: "get_config" }]);
  });

  it("sendSetConfig manda patch dentro do envelope", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    sock.sendSetConfig({ model: "large-v3-turbo", device: "cuda" });
    expect(fake.sent).toEqual([
      { type: "set_config", config: { model: "large-v3-turbo", device: "cuda" } },
    ]);
  });

  it("onConfig recebe o snapshot do servidor", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    const recv: SettingsSnapshot[] = [];
    sock.onConfig((s) => recv.push(s));
    fake.emit({ type: "config", settings: SAMPLE_SETTINGS });
    expect(recv).toHaveLength(1);
    expect(recv[0]!.model).toBe("tiny");
  });

  it("onConfigApplied entrega settings + reload info", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    const recv: ConfigAppliedEvent[] = [];
    sock.onConfigApplied((e) => recv.push(e));

    fake.emit({
      type: "config_applied",
      settings: { ...SAMPLE_SETTINGS, model: "large-v3-turbo" },
      reload: { changed: true, model: "large-v3-turbo", device: "cuda", error: null },
    });

    expect(recv).toHaveLength(1);
    expect(recv[0]!.settings.model).toBe("large-v3-turbo");
    expect(recv[0]!.reload?.changed).toBe(true);
    expect(recv[0]!.reload?.model).toBe("large-v3-turbo");
  });

  it("onConfigApplied com reload null (campo nao-hot) preserva null", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    const recv: ConfigAppliedEvent[] = [];
    sock.onConfigApplied((e) => recv.push(e));

    fake.emit({
      type: "config_applied",
      settings: SAMPLE_SETTINGS,
      reload: null,
    });

    expect(recv[0]!.reload).toBeNull();
  });

  it("config_applied com reload atualiza model/gpu do estado connected", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    fake.emit({ type: "ready", model: "tiny", gpu: false, protocol_version: 1 });

    // sanidade
    let state = sock.getState();
    expect(state.kind).toBe("connected");
    if (state.kind === "connected") {
      expect(state.model).toBe("tiny");
      expect(state.gpu).toBe(false);
    }

    fake.emit({
      type: "config_applied",
      settings: { ...SAMPLE_SETTINGS, model: "large-v3-turbo", device: "cuda" },
      reload: {
        changed: true,
        model: "large-v3-turbo",
        device: "cuda",
        error: null,
      },
    });

    state = sock.getState();
    expect(state.kind).toBe("connected");
    if (state.kind === "connected") {
      expect(state.model).toBe("large-v3-turbo");
      expect(state.gpu).toBe(true);
    }
  });

  it("config_applied sem reload (campo nao-hot) ainda sincroniza model do settings", async () => {
    const fake = makeFakeTransport();
    const sock = new DictationSocket("ws://test", async () => fake);
    await sock.connect();
    fake.emit({ type: "ready", model: "tiny", gpu: false, protocol_version: 1 });

    fake.emit({
      type: "config_applied",
      settings: { ...SAMPLE_SETTINGS, model: "tiny", mode: "toggle" },
      reload: null,
    });

    const state = sock.getState();
    expect(state.kind).toBe("connected");
    // Reload null com settings.model igual → model permanece, gpu segue settings.device
    if (state.kind === "connected") {
      expect(state.model).toBe("tiny");
      expect(state.gpu).toBe(false); // settings.device default "auto" != "cuda"
    }
  });
});
