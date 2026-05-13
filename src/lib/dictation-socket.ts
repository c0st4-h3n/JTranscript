/**
 * DictationSocket — máquina de estado do canal WS com o backend.
 *
 * Transport é injetável (port da Clean Architecture lado frontend). Testes
 * usam um fake; produção usa WebSocket nativo do navegador (ver `ws-transport.ts`).
 */

export type DictationState =
  | { kind: "idle" }
  | { kind: "connecting" }
  | { kind: "connected"; protocolVersion: number; model: string; gpu: boolean }
  | { kind: "error"; message: string };

export interface Transport {
  send(payload: unknown): void;
  close(): void;
  onMessage(cb: (msg: unknown) => void): void;
  onError(cb: (err: Error) => void): void;
  onClose(cb: () => void): void;
}

export type TransportFactory = (url: string) => Promise<Transport>;

export type SessionMode = "ptt" | "toggle";
export type SessionLang = "pt"; // MVP fixo

export interface SessionStartOpts {
  mode: SessionMode;
  polish: boolean;
  lang: SessionLang;
}

export interface PartialEvent {
  text: string;
  confidence: number;
  latencyMs: number;
  seq: number | null;
}

export interface FinalEvent {
  textRaw: string;
  textPolished: string | null;
  polishApplied: boolean;
  latencyMs: number;
  /** `true` se o backend encerrou via VAD (modo toggle, silêncio > limiar). */
  autoEnded: boolean;
}

export interface ServerError {
  code: string;
  message: string;
}

export interface SettingsSnapshot {
  version: number;
  model: string;
  device: string;
  language: string;
  mode: string;
  vad: string;
  silence_to_end_ms: number;
  polish_enabled: boolean;
  hotkey: string;
  blocklist_apps: string[];
}

export interface ReloadInfo {
  changed: boolean;
  model: string;
  device: string;
  error: string | null;
}

export interface ConfigAppliedEvent {
  settings: SettingsSnapshot;
  reload: ReloadInfo | null;
}

type ReadyPayload = {
  type: "ready";
  protocol_version?: number;
  model?: string;
  gpu?: boolean;
};

type PartialPayload = {
  type: "partial";
  text?: string;
  confidence?: number;
  latency_ms?: number;
  seq?: number;
};

type FinalPayload = {
  type: "final";
  text_raw?: string;
  text_polished?: string | null;
  polish_applied?: boolean;
  latency_ms?: number;
  auto_ended?: boolean;
};

type ErrorPayload = {
  type: "error";
  code: string;
  message: string;
};

type ConfigPayload = {
  type: "config";
  settings: SettingsSnapshot;
};

type ConfigAppliedPayload = {
  type: "config_applied";
  settings: SettingsSnapshot;
  reload: ReloadInfo | null;
};

export class DictationSocket {
  private state: DictationState = { kind: "idle" };
  private transport: Transport | null = null;
  private readonly stateListeners = new Set<(state: DictationState) => void>();
  private readonly partialListeners = new Set<(p: PartialEvent) => void>();
  private readonly finalListeners = new Set<(f: FinalEvent) => void>();
  private readonly errorListeners = new Set<(e: ServerError) => void>();
  private readonly configListeners = new Set<(s: SettingsSnapshot) => void>();
  private readonly configAppliedListeners = new Set<(e: ConfigAppliedEvent) => void>();

  constructor(
    private readonly url: string,
    private readonly transportFactory: TransportFactory,
  ) {}

  getState(): DictationState {
    return this.state;
  }

  subscribe(cb: (state: DictationState) => void): () => void {
    this.stateListeners.add(cb);
    cb(this.state);
    return () => {
      this.stateListeners.delete(cb);
    };
  }

  onPartial(cb: (p: PartialEvent) => void): () => void {
    this.partialListeners.add(cb);
    return () => {
      this.partialListeners.delete(cb);
    };
  }

  onFinal(cb: (f: FinalEvent) => void): () => void {
    this.finalListeners.add(cb);
    return () => {
      this.finalListeners.delete(cb);
    };
  }

  onServerError(cb: (e: ServerError) => void): () => void {
    this.errorListeners.add(cb);
    return () => {
      this.errorListeners.delete(cb);
    };
  }

  onConfig(cb: (s: SettingsSnapshot) => void): () => void {
    this.configListeners.add(cb);
    return () => {
      this.configListeners.delete(cb);
    };
  }

  onConfigApplied(cb: (e: ConfigAppliedEvent) => void): () => void {
    this.configAppliedListeners.add(cb);
    return () => {
      this.configAppliedListeners.delete(cb);
    };
  }

  async connect(): Promise<void> {
    if (this.state.kind === "connecting" || this.state.kind === "connected") {
      return;
    }
    this.setState({ kind: "connecting" });
    try {
      this.transport = await this.transportFactory(this.url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.setState({ kind: "error", message: msg });
      throw e;
    }
    this.transport.onMessage((raw) => this.handleMessage(raw));
    this.transport.onError((err) => this.setState({ kind: "error", message: err.message }));
    this.transport.onClose(() => this.setState({ kind: "idle" }));
  }

  ping(): void {
    this.requireTransport().send({ type: "ping" });
  }

  sendSessionStart(opts: SessionStartOpts): void {
    this.requireTransport().send({
      type: "session_start",
      mode: opts.mode,
      polish: opts.polish,
      lang: opts.lang,
    });
  }

  sendAudioChunk(data: string, seq: number): void {
    this.requireTransport().send({ type: "audio_chunk", data, seq });
  }

  sendSessionEnd(): void {
    this.requireTransport().send({ type: "session_end" });
  }

  sendCancel(): void {
    this.requireTransport().send({ type: "cancel" });
  }

  sendGetConfig(): void {
    this.requireTransport().send({ type: "get_config" });
  }

  sendSetConfig(patch: Partial<SettingsSnapshot>): void {
    this.requireTransport().send({ type: "set_config", config: patch });
  }

  close(): void {
    this.transport?.close();
    this.transport = null;
  }

  private requireTransport(): Transport {
    if (!this.transport) {
      throw new Error("envio antes de connect()");
    }
    return this.transport;
  }

  private handleMessage(raw: unknown): void {
    if (!isRecord(raw) || typeof raw["type"] !== "string") {
      return;
    }
    const msg = raw as { type: string };

    if (msg.type === "ready") {
      const ready = raw as ReadyPayload;
      this.setState({
        kind: "connected",
        protocolVersion: ready.protocol_version ?? 1,
        model: ready.model ?? "none",
        gpu: ready.gpu ?? false,
      });
      return;
    }

    if (msg.type === "partial") {
      const p = raw as PartialPayload;
      const event: PartialEvent = {
        text: p.text ?? "",
        confidence: p.confidence ?? 0,
        latencyMs: p.latency_ms ?? 0,
        seq: p.seq ?? null,
      };
      for (const cb of this.partialListeners) cb(event);
      return;
    }

    if (msg.type === "final") {
      const f = raw as FinalPayload;
      const event: FinalEvent = {
        textRaw: f.text_raw ?? "",
        textPolished: f.text_polished ?? null,
        polishApplied: f.polish_applied ?? false,
        latencyMs: f.latency_ms ?? 0,
        autoEnded: f.auto_ended ?? false,
      };
      for (const cb of this.finalListeners) cb(event);
      return;
    }

    if (msg.type === "error") {
      const err = raw as ErrorPayload;
      const event: ServerError = { code: err.code, message: err.message };
      for (const cb of this.errorListeners) cb(event);
      // Erro do servidor NÃO derruba o estado — pode ser recuperável (polish_timeout etc).
      // Apenas notifica listeners.
      return;
    }

    if (msg.type === "config") {
      const c = raw as ConfigPayload;
      for (const cb of this.configListeners) cb(c.settings);
      return;
    }

    if (msg.type === "config_applied") {
      const ca = raw as ConfigAppliedPayload;
      // Reload mudou o backend (model/device) → atualiza o snapshot do estado
      // pra a Pill refletir sem precisar de novo `ready`.
      if (this.state.kind === "connected" && ca.settings) {
        const effectiveDevice = ca.reload?.device ?? ca.settings.device;
        this.setState({
          kind: "connected",
          protocolVersion: this.state.protocolVersion,
          model: ca.settings.model,
          gpu: effectiveDevice === "cuda",
        });
      }
      const event: ConfigAppliedEvent = { settings: ca.settings, reload: ca.reload };
      for (const cb of this.configAppliedListeners) cb(event);
      return;
    }
  }

  private setState(next: DictationState): void {
    this.state = next;
    for (const cb of this.stateListeners) cb(next);
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
