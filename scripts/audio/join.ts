/**
 * Join several takes of one chant into a single track.
 *
 * A long chant often comes back from synthesis in parts. Concatenating the
 * files raw leaves the silence each take starts and ends with stacked up at
 * every seam, so this trims each part back to its own audio, drops in one
 * consistent breath between them, and fades the cuts so the joins do not click.
 *
 *   npx tsx scripts/audio/join.ts <out-name> <part.wav> <part.wav> ...
 */
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, join } from "node:path";
import { tmpdir } from "node:os";
import { decodeWav, encodeWav } from "../tts/dsp";

const GAP_SEC = 0.55; // the breath between parts, as if it were one recital
const LEAD_SEC = 0.06; // silence kept before the first word of a part
const TAIL_SEC = 0.18; // silence kept after the last word of a part
const EDGE_SEC = 0.015; // fade at each cut, short enough to be inaudible

const [outName, ...inputs] = process.argv.slice(2);
if (!outName || inputs.length < 2) {
  console.error("usage: join.ts <out-name> <part.wav> <part.wav> ...");
  process.exit(1);
}

/** The first and last sample that carries sound, measured per 20ms window. */
function bounds(samples: Float32Array, sampleRate: number) {
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const floor = peak * 0.01;
  const win = Math.floor(sampleRate * 0.02);

  const loud = (at: number) => {
    let max = 0;
    for (let j = at; j < at + win && j < samples.length; j++) {
      max = Math.max(max, Math.abs(samples[j]));
    }
    return max > floor;
  };

  let first = 0;
  for (let i = 0; i < samples.length; i += win) {
    if (loud(i)) { first = i; break; }
  }
  let last = samples.length;
  for (let i = samples.length - win; i >= 0; i -= win) {
    if (loud(i)) { last = Math.min(i + win, samples.length); break; }
  }
  return { first, last };
}

let sampleRate = 0;
const parts: Float32Array[] = [];

for (const path of inputs) {
  const pcm = decodeWav(readFileSync(path));
  if (!sampleRate) sampleRate = pcm.sampleRate;
  else if (pcm.sampleRate !== sampleRate) {
    // Resampling here would hide a mistake upstream; better to stop.
    console.error(
      `${basename(path)} is ${pcm.sampleRate}Hz but the first part is ${sampleRate}Hz`,
    );
    process.exit(1);
  }

  const { first, last } = bounds(pcm.samples, sampleRate);
  const from = Math.max(0, first - Math.floor(LEAD_SEC * sampleRate));
  const to = Math.min(pcm.samples.length, last + Math.floor(TAIL_SEC * sampleRate));
  const clip = pcm.samples.slice(from, to);

  const edge = Math.floor(EDGE_SEC * sampleRate);
  for (let i = 0; i < edge && i < clip.length; i++) {
    const t = i / edge;
    clip[i] *= t;
    clip[clip.length - 1 - i] *= t;
  }

  parts.push(clip);
  console.log(
    `  ${basename(path)}: ${(pcm.samples.length / sampleRate).toFixed(1)}s -> ` +
      `${(clip.length / sampleRate).toFixed(1)}s ` +
      `(ตัดหัว ${(from / sampleRate).toFixed(2)}s ตัดท้าย ` +
      `${((pcm.samples.length - to) / sampleRate).toFixed(2)}s)`,
  );
}

const gap = Math.floor(GAP_SEC * sampleRate);
const total =
  parts.reduce((n, p) => n + p.length, 0) + gap * (parts.length - 1);
const joined = new Float32Array(total);

let at = 0;
parts.forEach((part, i) => {
  joined.set(part, at);
  at += part.length + (i < parts.length - 1 ? gap : 0);
});

const wavPath = join(tmpdir(), `${outName}.joined.wav`);
writeFileSync(wavPath, encodeWav({ samples: joined, sampleRate }));

const outPath = join(process.cwd(), "public", "audio", `${outName}.m4a`);
execFileSync("/usr/bin/afconvert", [
  "-f", "m4af", "-d", "aac", "-b", "64000", "-q", "127", wavPath, outPath,
]);

const seconds = joined.length / sampleRate;
console.log(
  `\n${outName}: ${parts.length} ท่อน -> ${seconds.toFixed(1)}s ` +
    `(${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}) · ` +
    `${(statSync(outPath).size / 1024).toFixed(0)} KB`,
);
console.log(`durationSec: ${seconds.toFixed(1)}`);
