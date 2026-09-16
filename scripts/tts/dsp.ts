/**
 * Post-processing that moves a general-purpose TTS voice toward temple chanting.
 *
 * No neural voice available for Thai is trained on chanting, so the character
 * has to be built afterwards. Three things carry most of the difference:
 *
 *   - depth: chanting sits low in the chest, well below a news-reader register
 *   - a hall: chanting is always heard in a room with a long tail
 *   - numbers: it is usually a group, and several slightly-apart voices blur
 *     the machine artefacts that give a single synthetic take away
 *
 * Everything here works on mono 16-bit PCM as Float32 in [-1, 1].
 */

export interface Pcm {
  samples: Float32Array;
  sampleRate: number;
}

export function decodeWav(buf: Buffer): Pcm {
  let offset = 12;
  let dataOffset = 0;
  let dataSize = 0;
  while (offset < buf.length - 8) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "data") {
      dataOffset = offset + 8;
      dataSize = size;
      break;
    }
    offset += 8 + size + (size % 2);
  }
  const sampleRate = buf.readUInt32LE(24);
  const count = Math.floor(dataSize / 2);
  const samples = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    samples[i] = buf.readInt16LE(dataOffset + i * 2) / 32768;
  }
  return { samples, sampleRate };
}

export function encodeWav({ samples, sampleRate }: Pcm): Buffer {
  const pcm = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    pcm.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/** Linear resample. A factor below 1 stretches and deepens; above 1 raises. */
export function resample(input: Float32Array, factor: number): Float32Array {
  const out = new Float32Array(Math.floor(input.length / factor));
  for (let i = 0; i < out.length; i++) {
    const pos = i * factor;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const a = input[idx] ?? 0;
    const b = input[idx + 1] ?? a;
    out[i] = a + (b - a) * frac;
  }
  return out;
}

function comb(
  input: Float32Array,
  delaySamples: number,
  feedback: number,
  damping: number,
): Float32Array {
  const out = new Float32Array(input.length);
  const buf = new Float32Array(delaySamples);
  let idx = 0;
  let store = 0;
  for (let i = 0; i < input.length; i++) {
    const delayed = buf[idx];
    out[i] = delayed;
    // One-pole lowpass inside the loop: the tail loses highs as it decays,
    // the way a stone hall does.
    store = delayed * (1 - damping) + store * damping;
    buf[idx] = input[i] + store * feedback;
    idx = (idx + 1) % delaySamples;
  }
  return out;
}

function allpass(
  input: Float32Array,
  delaySamples: number,
  gain: number,
): Float32Array {
  const out = new Float32Array(input.length);
  const buf = new Float32Array(delaySamples);
  let idx = 0;
  for (let i = 0; i < input.length; i++) {
    const delayed = buf[idx];
    out[i] = -input[i] + delayed;
    buf[idx] = input[i] + delayed * gain;
    idx = (idx + 1) % delaySamples;
  }
  return out;
}

export interface ReverbOptions {
  /** Roughly how long the tail rings. 0.7 is a small sala, 0.9 a large wihan. */
  size: number;
  /** How much of the processed signal is mixed in, 0-1. */
  wet: number;
  /** Highs lost per pass through the tail, 0-1. */
  damping: number;
}

/**
 * Schroeder reverb: four parallel combs for density, two allpasses to smear
 * the result so it stops sounding like discrete echoes.
 */
export function reverb(
  { samples, sampleRate }: Pcm,
  { size, wet, damping }: ReverbOptions,
): Pcm {
  // Mutually non-harmonic delays, so the combs do not reinforce one pitch.
  const combMs = [29.7, 37.1, 41.1, 43.7];
  const feedback = 0.7 + size * 0.28;

  // Widened so the allpass pass below, which returns a fresh array, can reassign it.
  let tail: Float32Array = new Float32Array(samples.length);
  for (const ms of combMs) {
    const delay = Math.max(1, Math.round((ms / 1000) * sampleRate * (0.7 + size * 0.6)));
    const c = comb(samples, delay, feedback, damping);
    for (let i = 0; i < tail.length; i++) tail[i] += c[i] * 0.25;
  }
  for (const ms of [5.0, 1.7]) {
    tail = allpass(tail, Math.max(1, Math.round((ms / 1000) * sampleRate)), 0.7);
  }

  const out = new Float32Array(samples.length);
  for (let i = 0; i < out.length; i++) {
    out[i] = samples[i] * (1 - wet * 0.5) + tail[i] * wet;
  }
  return { samples: out, sampleRate };
}

export interface ChorusVoice {
  /** Resampling factor. Small offsets from 1 read as separate people. */
  detune: number;
  /** Start offset in milliseconds. */
  delayMs: number;
  gain: number;
}

/**
 * Stack detuned, offset copies so one take reads as several people chanting.
 *
 * Monks rarely chant alone, and a group is also far more forgiving: no two
 * people land a syllable at the same instant, and that smearing hides the
 * uncanny evenness of a synthetic voice.
 */
export function layer({ samples, sampleRate }: Pcm, voices: ChorusVoice[]): Pcm {
  const copies = voices.map((v) => ({
    data: resample(samples, v.detune),
    offset: Math.round((v.delayMs / 1000) * sampleRate),
    gain: v.gain,
  }));

  const length = Math.max(...copies.map((c) => c.data.length + c.offset));
  const out = new Float32Array(length);
  for (const c of copies) {
    for (let i = 0; i < c.data.length; i++) out[i + c.offset] += c.data[i] * c.gain;
  }
  return normalise({ samples: out, sampleRate });
}

/** Scale to a fixed headroom so every test sample plays back at the same level. */
export function normalise({ samples, sampleRate }: Pcm, peak = 0.89): Pcm {
  let max = 0;
  for (const s of samples) max = Math.max(max, Math.abs(s));
  if (max === 0) return { samples, sampleRate };
  const gain = peak / max;
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) out[i] = samples[i] * gain;
  return { samples: out, sampleRate };
}

/** Trim the brightness that makes a synthetic voice sound like a phone line. */
export function lowpass({ samples, sampleRate }: Pcm, cutoffHz: number): Pcm {
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const dt = 1 / sampleRate;
  const alpha = dt / (rc + dt);
  const out = new Float32Array(samples.length);
  let prev = 0;
  for (let i = 0; i < samples.length; i++) {
    prev += alpha * (samples[i] - prev);
    out[i] = prev;
  }
  return { samples: out, sampleRate };
}

/** Pad silence onto the end so a reverb tail is not cut off. */
export function padTail({ samples, sampleRate }: Pcm, ms: number): Pcm {
  const extra = Math.round((ms / 1000) * sampleRate);
  const out = new Float32Array(samples.length + extra);
  out.set(samples, 0);
  return { samples: out, sampleRate };
}
