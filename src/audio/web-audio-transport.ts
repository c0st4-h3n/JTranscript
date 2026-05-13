/**
 * Adapter `AudioCaptureTransport` que usa Web Audio + AudioWorklet.
 *
 * Pede `getUserMedia({audio})` e cria AudioContext com `sampleRate: 16000` —
 * Chromium/WebView2 reamostra automaticamente. O worklet
 * (`recorder-worklet.js`) acumula em chunks de N samples e devolve via
 * `MessagePort.postMessage` pra main thread.
 *
 * Não tem cobertura de vitest direto — AudioContext em jsdom é shim sem
 * comportamento real. Smoke deste módulo acontece em `npm run tauri dev`.
 */

import workletUrl from "./recorder-worklet.js?url";
import type { AudioCaptureTransport, CaptureOpts } from "./recorder";

export class WebAudioCaptureTransport implements AudioCaptureTransport {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private chunkCb: ((c: Float32Array) => void) | null = null;
  private levelCb: ((r: number) => void) | null = null;
  private errCb: ((e: Error) => void) | null = null;

  onChunk(cb: (c: Float32Array) => void): void {
    this.chunkCb = cb;
  }
  onLevel(cb: (r: number) => void): void {
    this.levelCb = cb;
  }
  onError(cb: (e: Error) => void): void {
    this.errCb = cb;
  }

  async start(opts: CaptureOpts): Promise<void> {
    try {
      this.ctx = new AudioContext({ sampleRate: opts.sampleRate });
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      await this.ctx.audioWorklet.addModule(workletUrl);
      const chunkSamples = Math.round((opts.chunkDurationMs / 1000) * opts.sampleRate);
      this.node = new AudioWorkletNode(this.ctx, "jarvs-recorder", {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        channelCount: 1,
        processorOptions: { chunkSamples },
      });
      this.node.port.onmessage = (e: MessageEvent) => {
        const data = e.data as { type: string; samples?: Float32Array; rms?: number };
        if (data.type === "chunk" && data.samples) {
          this.chunkCb?.(data.samples);
          if (typeof data.rms === "number") this.levelCb?.(data.rms);
        }
      };
      this.node.port.onmessageerror = (e) => {
        this.errCb?.(new Error(`worklet message error: ${String(e)}`));
      };
      this.source = this.ctx.createMediaStreamSource(this.stream);
      this.source.connect(this.node);
    } catch (e) {
      await this.stop();
      throw e;
    }
  }

  async stop(): Promise<void> {
    try {
      this.source?.disconnect();
    } catch {
      // ignore
    }
    this.source = null;
    if (this.node) {
      try {
        this.node.port.close();
        this.node.disconnect();
      } catch {
        // ignore
      }
      this.node = null;
    }
    if (this.stream) {
      for (const t of this.stream.getTracks()) t.stop();
      this.stream = null;
    }
    if (this.ctx) {
      try {
        await this.ctx.close();
      } catch {
        // ignore — ctx ja fechado
      }
      this.ctx = null;
    }
  }
}

export function createWebAudioCaptureTransport(): AudioCaptureTransport {
  return new WebAudioCaptureTransport();
}
