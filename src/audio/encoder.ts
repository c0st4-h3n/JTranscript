/**
 * Encoder PCM float32 LE -> base64 (e volta) — wire format do `audio_chunk`.
 *
 * O backend Python decodifica via `voice.audio_codec.decode_pcm_f32_b64`
 * com `np.frombuffer(..., dtype=np.float32)`. Mantemos o mesmo layout aqui:
 * little-endian (default em x86/ARM), sem header, plain Float32Array.bytes.
 *
 * Implementação portátil (Node + browser) — usa `btoa`/`atob`, com chunking
 * pra evitar stack overflow do `String.fromCharCode(...spread)` em arrays grandes.
 */

const CHUNK_BYTES = 0x8000;

export function float32ToBase64(samples: Float32Array): string {
  if (samples.length === 0) return "";
  const bytes = new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
  let bin = "";
  for (let i = 0; i < bytes.length; i += CHUNK_BYTES) {
    const end = Math.min(i + CHUNK_BYTES, bytes.length);
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, end)));
  }
  return btoa(bin);
}

export function base64ToFloat32(b64: string): Float32Array {
  if (b64.length === 0) return new Float32Array(0);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  if (bytes.length % 4 !== 0) {
    throw new Error(
      `payload base64 nao decodifica num multiplo de 4 bytes (got ${bytes.length})`,
    );
  }
  // `new Float32Array(bytes.buffer)` espera byteOffset alinhado a 4 — `bytes.buffer`
  // foi alocado fresco aqui, então byteOffset=0. OK.
  return new Float32Array(bytes.buffer);
}
