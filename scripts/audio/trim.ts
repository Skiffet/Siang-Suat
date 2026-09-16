/**
 * Trim the dead tail off a TTS take and encode it for the web.
 *
 * Gemini's streaming synthesis can keep emitting empty PCM long after the last
 * word — one take here ran 3 minutes of speech followed by 8 minutes of
 * silence. This cuts at the last audible sample, fades the cut so it does not
 * click, and hands the result to afconvert for AAC.
 *
 *   npx tsx scripts/audio/trim.ts <in.wav> <out-name> [--to <seconds>]
 *
 * `--to` cuts the take short at a given point, for dropping a whole trailing
 * section — a recital that reads the Pali and then its translation, where only
 * the Pali is wanted. Use scripts/audio/sections.ts to find the seam.
 */
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { decodeWav, encodeWav } from "../tts/dsp";

const TAIL_SEC = 1.2; // breathing room kept after the last word
const FADE_SEC = 0.8; // fade applied inside that tail

const args = process.argv.slice(2);
const toIndex = args.indexOf("--to");
const cutAtSec = toIndex >= 0 ? Number(args[toIndex + 1]) : null;
const [input, outName] = args.filter(
  (a, i) => i !== toIndex && i !== toIndex + 1,
);
if (!input || !outName || (cutAtSec !== null && !Number.isFinite(cutAtSec))) {
  console.error("usage: trim.ts <in.wav> <out-name> [--to <seconds>]");
  process.exit(1);
}

const decoded = decodeWav(readFileSync(input));
const sampleRate = decoded.sampleRate;
// An explicit cut wins over silence detection; the tail being dropped here is
// speech, not silence, so there is nothing for the detector to find.
const samples =
  cutAtSec === null
    ? decoded.samples
    : decoded.samples.slice(0, Math.floor(cutAtSec * sampleRate));

// Peak per 50ms window; the noise floor sits far below 1% of the loudest window.
const win = Math.floor(sampleRate * 0.05);
let peak = 0;
for (const s of samples) peak = Math.max(peak, Math.abs(s));
const floor = peak * 0.01;

let lastAudible = samples.length;
for (let i = samples.length - win; i >= 0; i -= win) {
  let windowPeak = 0;
  for (let j = i; j < i + win && j < samples.length; j++) {
    windowPeak = Math.max(windowPeak, Math.abs(samples[j]));
  }
  if (windowPeak > floor) {
    lastAudible = Math.min(i + win, samples.length);
    break;
  }
}

const end = Math.min(samples.length, lastAudible + Math.floor(TAIL_SEC * sampleRate));
const trimmed = samples.slice(0, end);

const fade = Math.floor(FADE_SEC * sampleRate);
for (let i = 0; i < fade && i < trimmed.length; i++) {
  const t = i / fade;
  trimmed[trimmed.length - 1 - i] *= t * t; // quadratic — gentler than linear
}

const wavPath = join(tmpdir(), `${outName}.trimmed.wav`);
writeFileSync(wavPath, encodeWav({ samples: trimmed, sampleRate }));

const outPath = join(process.cwd(), "public", "audio", `${outName}.m4a`);
execFileSync("/usr/bin/afconvert", [
  "-f", "m4af",
  "-d", "aac",
  "-b", "64000",
  "-q", "127",
  wavPath,
  outPath,
]);

const before = decoded.samples.length / sampleRate;
const after = trimmed.length / sampleRate;
console.log(
  `${outName}: ${before.toFixed(1)}s -> ${after.toFixed(1)}s ` +
    `(cut ${(before - after).toFixed(1)}s) · ` +
    `${(statSync(outPath).size / 1024).toFixed(0)} KB · ${outPath}`,
);
