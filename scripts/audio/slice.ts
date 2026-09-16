/**
 * Cut named stretches out of a recording, and keep or drop what is left.
 *
 * Some takes hold more than one chant. บทขอขมาพระรัตนตรัย opens with นะโม
 * ตัสสะ three times, which is not really part of it — นะโม opens a sitting,
 * and is wanted on its own so any sitting can start with it.
 *
 * Ranges come from the alignment rather than by ear: once a chant's line
 * timings are known, the boundary between one passage and the next is a
 * number already sitting in its JSON.
 *
 *   npx tsx scripts/audio/slice.ts <out-name> <in.wav> <from>:<to> [...]
 *
 * An empty side means the start or the end of the take, so `:8.18` is
 * everything up to 8.18s and `42.9:` is everything after 42.9s. Several
 * ranges are joined in the order given, which is how a passage is lifted out
 * of the middle while the rest stays one piece.
 */
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { decodeWav, encodeWav } from "../tts/dsp";

const GAP_SEC = 0.45; // between joined ranges, as if it were one recital
const EDGE_SEC = 0.015; // fade at each cut, short enough to be inaudible

const [outName, input, ...specs] = process.argv.slice(2);
if (!outName || !input || !specs.length) {
  console.error("usage: slice.ts <out-name> <in.wav> <from>:<to> [...]");
  process.exit(1);
}

const { samples, sampleRate } = decodeWav(readFileSync(input));
const total = samples.length / sampleRate;

const ranges = specs.map((spec) => {
  const [a, b] = spec.split(":");
  const from = a === "" ? 0 : Number(a);
  const to = b === "" || b === undefined ? total : Number(b);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
    console.error(`ช่วงไม่ถูกต้อง: ${spec}`);
    process.exit(1);
  }
  return { from, to: Math.min(to, total) };
});

const pieces = ranges.map(({ from, to }) => {
  const clip = samples.slice(
    Math.floor(from * sampleRate),
    Math.floor(to * sampleRate),
  );
  const edge = Math.floor(EDGE_SEC * sampleRate);
  for (let i = 0; i < edge && i < clip.length; i++) {
    const t = i / edge;
    clip[i] *= t;
    clip[clip.length - 1 - i] *= t;
  }
  return clip;
});

const gap = Math.floor(GAP_SEC * sampleRate);
const length =
  pieces.reduce((n, p) => n + p.length, 0) + gap * (pieces.length - 1);
const out = new Float32Array(length);
let at = 0;
pieces.forEach((piece, i) => {
  out.set(piece, at);
  at += piece.length + (i < pieces.length - 1 ? gap : 0);
});

const wavPath = join(tmpdir(), `${outName}.slice.wav`);
writeFileSync(wavPath, encodeWav({ samples: out, sampleRate }));

const outPath = join(process.cwd(), "public", "audio", `${outName}.m4a`);
execFileSync("/usr/bin/afconvert", [
  "-f", "m4af", "-d", "aac", "-b", "64000", "-q", "127", wavPath, outPath,
]);

const seconds = out.length / sampleRate;
ranges.forEach((r) =>
  console.log(`  เก็บ ${r.from.toFixed(2)}s – ${r.to.toFixed(2)}s  (${(r.to - r.from).toFixed(1)}s)`),
);
console.log(
  `${outName}: ${total.toFixed(1)}s -> ${seconds.toFixed(1)}s · ` +
    `${(statSync(outPath).size / 1024).toFixed(0)} KB`,
);
console.log(`durationSec: ${seconds.toFixed(1)}`);
