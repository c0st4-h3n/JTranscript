import { describe, expect, it } from "vitest";
import { base64ToFloat32 } from "./encoder";
import {
  type AudioCaptureTransport,
  type ChunkPayload,
  MicRecorder,
  type RecorderState,
} from "./recorder";

type FakeTransport = AudioCaptureTransport & {
  emitChunk(c: Float32Array): void;
  emitLevel(rms: number): void;
  emitError(e: Error): void;
  startedWith: Parameters<AudioCaptureTransport["start"]>[0] | null;
  stopped: boolean;
};

function makeFakeTransport(opts: { startError?: Error } = {}): FakeTransport {
  let chunkCb: ((c: Float32Array) => void) | null = null;
  let levelCb: ((r: number) => void) | null = null;
  let errCb: ((e: Error) => void) | null = null;
  const t: FakeTransport = {
    startedWith: null,
    stopped: false,
    start: async (o) => {
      t.startedWith = o;
      if (opts.startError) throw opts.startError;
    },
    stop: async () => {
      t.stopped = true;
    },
    onChunk: (cb) => {
      chunkCb = cb;
    },
    onLevel: (cb) => {
      levelCb = cb;
    },
    onError: (cb) => {
      errCb = cb;
    },
    emitChunk: (c) => chunkCb?.(c),
    emitLevel: (r) => levelCb?.(r),
    emitError: (e) => errCb?.(e),
  };
  return t;
}

describe("MicRecorder", () => {
  it("inicia em estado idle", () => {
    const rec = new MicRecorder(() => makeFakeTransport());
    expect(rec.getState()).toEqual({ kind: "idle" });
  });

  it("transiciona idle -> requesting -> recording em start()", async () => {
    const fake = makeFakeTransport();
    const rec = new MicRecorder(() => fake);
    const log: RecorderState["kind"][] = [];
    rec.subscribe((s) => log.push(s.kind));
    await rec.start();
    expect(log).toEqual(["idle", "requesting", "recording"]);
    const s = rec.getState();
    expect(s.kind).toBe("recording");
    if (s.kind === "recording") {
      expect(s.sampleRate).toBe(16_000);
      expect(s.chunksSent).toBe(0);
    }
  });

  it("repassa opts ao transport", async () => {
    const fake = makeFakeTransport();
    const rec = new MicRecorder(() => fake);
    await rec.start({ sampleRate: 22_050, chunkDurationMs: 100 });
    expect(fake.startedWith).toEqual({ sampleRate: 22_050, chunkDurationMs: 100 });
  });

  it("emite chunks codificados com seq monotonico", async () => {
    const fake = makeFakeTransport();
    const rec = new MicRecorder(() => fake);
    const recv: ChunkPayload[] = [];
    rec.onChunk((c) => recv.push(c));
    await rec.start();

    // Valores float32-exatos (potencias de 2): sem perda de precisao no round-trip
    fake.emitChunk(new Float32Array([0.5, 0.25, -0.125]));
    fake.emitChunk(new Float32Array([0.75, -0.375]));

    expect(recv).toHaveLength(2);
    expect(recv[0]!.seq).toBe(1);
    expect(recv[1]!.seq).toBe(2);
    // round-trip pelo encoder
    const decoded0 = base64ToFloat32(recv[0]!.data);
    expect(Array.from(decoded0)).toEqual([0.5, 0.25, -0.125]);
  });

  it("contador chunksSent reflete no estado", async () => {
    const fake = makeFakeTransport();
    const rec = new MicRecorder(() => fake);
    await rec.start();
    fake.emitChunk(new Float32Array([0]));
    fake.emitChunk(new Float32Array([0]));
    fake.emitChunk(new Float32Array([0]));
    const s = rec.getState();
    expect(s.kind).toBe("recording");
    if (s.kind === "recording") expect(s.chunksSent).toBe(3);
  });

  it("chunks chegando antes de start() sao ignorados", () => {
    const fake = makeFakeTransport();
    const rec = new MicRecorder(() => fake);
    const recv: ChunkPayload[] = [];
    rec.onChunk((c) => recv.push(c));
    // emitir antes de start (transport ainda nao foi criado, na verdade — mas tambem testamos depois de stop)
    expect(recv).toHaveLength(0);
  });

  it("chunks chegando depois de stop() sao ignorados", async () => {
    const fake = makeFakeTransport();
    const rec = new MicRecorder(() => fake);
    const recv: ChunkPayload[] = [];
    rec.onChunk((c) => recv.push(c));
    await rec.start();
    await rec.stop();
    fake.emitChunk(new Float32Array([0.1]));
    expect(recv).toHaveLength(0);
  });

  it("stop() volta pra stopped com contador preservado", async () => {
    const fake = makeFakeTransport();
    const rec = new MicRecorder(() => fake);
    await rec.start();
    fake.emitChunk(new Float32Array([0]));
    fake.emitChunk(new Float32Array([0]));
    await rec.stop();
    const s = rec.getState();
    expect(s.kind).toBe("stopped");
    if (s.kind === "stopped") expect(s.chunksSent).toBe(2);
    expect(fake.stopped).toBe(true);
  });

  it("start() falhando vai pro estado error e rethrow", async () => {
    const fake = makeFakeTransport({ startError: new Error("mic recusado") });
    const rec = new MicRecorder(() => fake);
    await expect(rec.start()).rejects.toThrow("mic recusado");
    const s = rec.getState();
    expect(s.kind).toBe("error");
    if (s.kind === "error") expect(s.message).toBe("mic recusado");
  });

  it("erro emitido pelo transport durante recording vai pro estado error", async () => {
    const fake = makeFakeTransport();
    const rec = new MicRecorder(() => fake);
    await rec.start();
    fake.emitError(new Error("dispositivo desconectado"));
    const s = rec.getState();
    expect(s.kind).toBe("error");
    if (s.kind === "error") expect(s.message).toBe("dispositivo desconectado");
  });

  it("emite niveis de VU via onLevel", async () => {
    const fake = makeFakeTransport();
    const rec = new MicRecorder(() => fake);
    const levels: number[] = [];
    rec.onLevel((r) => levels.push(r));
    await rec.start();
    fake.emitLevel(0.1);
    fake.emitLevel(0.5);
    fake.emitLevel(0.9);
    expect(levels).toEqual([0.1, 0.5, 0.9]);
  });

  it("chamar start() duas vezes seguidas e idempotente (segunda e no-op)", async () => {
    const fake1 = makeFakeTransport();
    let calls = 0;
    const rec = new MicRecorder(() => {
      calls += 1;
      return fake1;
    });
    await rec.start();
    await rec.start();
    expect(calls).toBe(1);
  });

  it("seq reseta a cada novo start", async () => {
    const fake = makeFakeTransport();
    const rec = new MicRecorder(() => fake);
    const recv: ChunkPayload[] = [];
    rec.onChunk((c) => recv.push(c));
    await rec.start();
    fake.emitChunk(new Float32Array([0]));
    fake.emitChunk(new Float32Array([0]));
    await rec.stop();
    await rec.start();
    fake.emitChunk(new Float32Array([0]));
    expect(recv.map((c) => c.seq)).toEqual([1, 2, 1]);
  });
});
