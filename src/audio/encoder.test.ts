import { describe, expect, it } from "vitest";
import { base64ToFloat32, float32ToBase64 } from "./encoder";

describe("float32ToBase64 / base64ToFloat32", () => {
  it("round-trip preserva amostras exatamente", () => {
    const samples = new Float32Array([0.0, 0.5, -0.5, 0.99, -0.99, 1e-6]);
    const b64 = float32ToBase64(samples);
    const decoded = base64ToFloat32(b64);
    expect(Array.from(decoded)).toEqual(Array.from(samples));
  });

  it("array vazio vira string vazia e vice-versa", () => {
    expect(float32ToBase64(new Float32Array(0))).toBe("");
    expect(base64ToFloat32("").length).toBe(0);
  });

  it("aguenta arrays grandes sem stack overflow", () => {
    const samples = new Float32Array(100_000);
    for (let i = 0; i < samples.length; i++) samples[i] = (i % 1000) / 1000;
    const b64 = float32ToBase64(samples);
    const decoded = base64ToFloat32(b64);
    expect(decoded.length).toBe(100_000);
    expect(decoded[0]).toBe(samples[0]);
    expect(decoded[50_000]).toBe(samples[50_000]);
    expect(decoded[99_999]).toBe(samples[99_999]);
  });

  it("base64 decodificado com bytes desalinhados explode", () => {
    // 3 bytes -> nao multiplo de 4
    const b64 = btoa("abc");
    expect(() => base64ToFloat32(b64)).toThrow(/multiplo de 4/);
  });

  it("layout no fio bate com o esperado pelo backend (frombuffer float32 LE)", () => {
    // Sanity: 1.0 em float32 LE = bytes [0x00, 0x00, 0x80, 0x3F]
    const samples = new Float32Array([1.0]);
    const b64 = float32ToBase64(samples);
    // base64 desses 4 bytes:
    expect(b64).toBe("AACAPw==");
  });
});
