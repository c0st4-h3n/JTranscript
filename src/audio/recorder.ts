/**
 * MicRecorder — máquina de estado da captura de microfone.
 *
 * Transport é injetável: produção usa `WebAudioCaptureTransport`, testes usam
 * fake que controla quando frames chegam. Mesma filosofia do `DictationSocket`.
 *
 * Não toca em `WebSocket` — apenas emite `onChunk({data, seq})` pra quem quiser
 * consumir (tipicamente um hook React que pluga no DictationSocket).
 */

import { float32ToBase64 } from "./encoder";

export type RecorderState =
  | { kind: "idle" }
  | { kind: "requesting" }
  | { kind: "recording"; sampleRate: number; chunksSent: number }
  | { kind: "stopped"; chunksSent: number }
  | { kind: "error"; message: string };

export interface CaptureOpts {
  sampleRate: number;
  chunkDurationMs: number;
}

export const DEFAULT_CAPTURE_OPTS: CaptureOpts = {
  sampleRate: 16_000,
  chunkDurationMs: 200,
};

export interface AudioCaptureTransport {
  start(opts: CaptureOpts): Promise<void>;
  stop(): Promise<void>;
  onChunk(cb: (chunk: Float32Array) => void): void;
  onLevel(cb: (rms: number) => void): void;
  onError(cb: (err: Error) => void): void;
}

export type AudioCaptureFactory = () => AudioCaptureTransport;

export interface ChunkPayload {
  data: string;
  seq: number;
}

export class MicRecorder {
  private state: RecorderState = { kind: "idle" };
  private transport: AudioCaptureTransport | null = null;
  private seq = 0;
  private readonly stateListeners = new Set<(s: RecorderState) => void>();
  private readonly chunkListeners = new Set<(c: ChunkPayload) => void>();
  private readonly levelListeners = new Set<(rms: number) => void>();

  constructor(private readonly factory: AudioCaptureFactory) {}

  getState(): RecorderState {
    return this.state;
  }

  subscribe(cb: (s: RecorderState) => void): () => void {
    this.stateListeners.add(cb);
    cb(this.state);
    return () => {
      this.stateListeners.delete(cb);
    };
  }

  onChunk(cb: (c: ChunkPayload) => void): () => void {
    this.chunkListeners.add(cb);
    return () => {
      this.chunkListeners.delete(cb);
    };
  }

  onLevel(cb: (rms: number) => void): () => void {
    this.levelListeners.add(cb);
    return () => {
      this.levelListeners.delete(cb);
    };
  }

  async start(opts: Partial<CaptureOpts> = {}): Promise<void> {
    if (this.state.kind === "requesting" || this.state.kind === "recording") {
      return;
    }
    const resolved: CaptureOpts = { ...DEFAULT_CAPTURE_OPTS, ...opts };
    this.seq = 0;
    this.setState({ kind: "requesting" });

    const transport = this.factory();
    transport.onChunk((chunk) => this.handleChunk(chunk));
    transport.onLevel((rms) => this.handleLevel(rms));
    transport.onError((err) =>
      this.setState({ kind: "error", message: err.message }),
    );
    this.transport = transport;

    try {
      await transport.start(resolved);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.transport = null;
      this.setState({ kind: "error", message: msg });
      throw e;
    }
    this.setState({
      kind: "recording",
      sampleRate: resolved.sampleRate,
      chunksSent: 0,
    });
  }

  async stop(): Promise<void> {
    const t = this.transport;
    this.transport = null;
    if (t) {
      try {
        await t.stop();
      } catch {
        // ignora — vamos pro estado stopped de qualquer jeito
      }
    }
    const chunksSent = this.state.kind === "recording" ? this.state.chunksSent : 0;
    this.setState({ kind: "stopped", chunksSent });
  }

  private handleChunk(chunk: Float32Array): void {
    if (this.state.kind !== "recording") return;
    this.seq += 1;
    const payload: ChunkPayload = {
      data: float32ToBase64(chunk),
      seq: this.seq,
    };
    for (const cb of this.chunkListeners) cb(payload);
    this.setState({
      ...this.state,
      chunksSent: this.state.chunksSent + 1,
    });
  }

  private handleLevel(rms: number): void {
    for (const cb of this.levelListeners) cb(rms);
  }

  private setState(next: RecorderState): void {
    this.state = next;
    for (const cb of this.stateListeners) cb(next);
  }
}
