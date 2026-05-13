// AudioWorkletProcessor que roda no Audio Rendering Thread.
//
// Recebe frames @ sampleRate do contexto (definimos 16000 ao criar o AudioContext).
// Acumula até `chunkSamples` (default 3200 = 200ms @ 16kHz) e envia via port.
// Também computa RMS por chunk pra alimentar o VU sem decodificar base64 do outro lado.
//
// Mantido em .js puro (não .ts) porque AudioWorkletProcessor vive em escopo isolado
// — Vite serve como módulo separado via `new URL(..., import.meta.url)`.

class JarvsRecorderProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = (options && options.processorOptions) || {};
    this.chunkSamples = opts.chunkSamples || 3200;
    this.buffer = new Float32Array(this.chunkSamples * 2);
    this.bufferFill = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const ch = input[0];
    if (!ch || ch.length === 0) return true;

    // Append ao buffer; reallocate se precisar
    if (this.bufferFill + ch.length > this.buffer.length) {
      const next = new Float32Array(Math.max(this.buffer.length * 2, this.bufferFill + ch.length));
      next.set(this.buffer.subarray(0, this.bufferFill));
      this.buffer = next;
    }
    this.buffer.set(ch, this.bufferFill);
    this.bufferFill += ch.length;

    // Drena chunks completos
    while (this.bufferFill >= this.chunkSamples) {
      // Copia (precisa transferir ownership pro main thread sem afetar o buffer)
      const chunk = new Float32Array(this.chunkSamples);
      chunk.set(this.buffer.subarray(0, this.chunkSamples));

      // RMS pra VU
      let sumSq = 0;
      for (let i = 0; i < chunk.length; i++) sumSq += chunk[i] * chunk[i];
      const rms = Math.sqrt(sumSq / chunk.length);

      this.port.postMessage({ type: "chunk", samples: chunk, rms }, [chunk.buffer]);

      // Shift buffer
      this.buffer.copyWithin(0, this.chunkSamples, this.bufferFill);
      this.bufferFill -= this.chunkSamples;
    }

    return true;
  }
}

registerProcessor("jarvs-recorder", JarvsRecorderProcessor);
