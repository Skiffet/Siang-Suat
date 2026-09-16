/**
 * Work out when each line of a chant is spoken, by listening for the pauses.
 *
 * Takes made outside `scripts/tts` arrive as finished audio with no timings,
 * so the player cannot highlight along. Recovering them by ear would mean
 * tapping through every line of every chant.
 *
 * Chanting makes that largely unnecessary: a recital separates its lines with
 * silence. But not every silence ends a line — a long line is delivered with
 * breaths inside it, and those look exactly the same to a detector. So the
 * silences are treated as *candidate* line breaks, and which ones are real is
 * decided by fit: a line twice as long takes about twice as long to say, so
 * the right set of breaks is the one whose segment lengths track the lines'
 * text lengths.
 *
 * Choosing that set is a shortest-path problem over the candidates, solved
 * exactly rather than greedily — a breath misread early would otherwise push
 * every line after it onto the wrong words.
 *
 *   npx tsx scripts/audio/align.ts <slug> [--dry]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { decodeWav } from "../tts/dsp";
import type { Chant, SegmentTiming } from "../../src/lib/types";

/** Shortest silence that could plausibly end a line. */
const MIN_GAP_SEC = 0.16;
/** Analysis resolution. */
const STEP = 0.02;

const [slug, ...flags] = process.argv.slice(2);
const dry = flags.includes("--dry");
if (!slug) {
  console.error("usage: align.ts <slug> [--dry]");
  process.exit(1);
}

const chantPath = join(process.cwd(), "content", "chants", `${slug}.json`);
const chant = JSON.parse(readFileSync(chantPath, "utf8")) as Chant;
if (!chant.audio) {
  console.error(`${slug}: ไม่มี audio ที่ใส่เอง — pipeline เป็นคนจัดการ timing`);
  process.exit(1);
}

/** The lines the player will show, in order, with repeats expanded. */
const lines: { sourceIndex: number; repeatIndex: number; text: string }[] = [];
for (let r = 0; r < (chant.repeat ?? 1); r++) {
  chant.segments.forEach((seg, i) => {
    if (seg.kind !== "silence") {
      lines.push({ sourceIndex: i, repeatIndex: r, text: seg.text });
    }
  });
}

// The published file is AAC; afconvert already backs the trim and join steps.
const wavPath = join(tmpdir(), `${slug}.align.wav`);
execFileSync("/usr/bin/afconvert", [
  "-f", "WAVE", "-d", "LEI16",
  join(process.cwd(), "public", "audio", chant.audio.file), wavPath,
]);
const { samples, sampleRate } = decodeWav(readFileSync(wavPath));
const total = samples.length / sampleRate;

let peak = 0;
for (const s of samples) peak = Math.max(peak, Math.abs(s));
const floor = peak * 0.02;

const WIN = Math.floor(sampleRate * STEP);
const env: number[] = [];
for (let i = 0; i < samples.length; i += WIN) {
  let m = 0;
  for (let j = i; j < i + WIN && j < samples.length; j++) m = Math.max(m, Math.abs(samples[j]));
  env.push(m);
}

// Candidate boundaries: the moment speech resumes after each silence.
const minWindows = Math.round(MIN_GAP_SEC / STEP);
const candidates: { at: number; gap: number }[] = [];
let quiet = 0;
let speechStart = 0;
let seenSpeech = false;
env.forEach((v, i) => {
  if (v <= floor) {
    quiet++;
    return;
  }
  if (!seenSpeech) {
    speechStart = i * STEP;
    seenSpeech = true;
  } else if (quiet >= minWindows) {
    candidates.push({ at: i * STEP, gap: quiet * STEP });
  }
  quiet = 0;
});

if (candidates.length < lines.length - 1) {
  console.error(
    `${slug}: เจอรอยต่อ ${candidates.length} จุด แต่ต้องแบ่ง ${lines.length} วรรค — ` +
      `เสียงเว้นจังหวะน้อยเกินกว่าจะแบ่งได้`,
  );
  process.exit(1);
}

// Each line should take a share of the audio proportional to its text.
const charTotal = lines.reduce((n, l) => n + l.text.length, 0);
const want = lines.map((l) => ((total - speechStart) * l.text.length) / charTotal);

// Positions a boundary may sit at: the start of speech, each candidate, the end.
const pos = [speechStart, ...candidates.map((c) => c.at), total];
const gapOf = [0, ...candidates.map((c) => c.gap), 0];
const N = lines.length;
const M = pos.length;

/**
 * Relative error, so a second of drift counts for more on a short line than on
 * a long one — which is how it reads on screen.
 */
function cost(lineIndex: number, from: number, to: number) {
  const dur = pos[to] - pos[from];
  if (dur <= 0) return Infinity;
  const err = (dur - want[lineIndex]) / want[lineIndex];
  // A longer silence is likelier to be a real line break; tilt ties that way.
  return err * err - 0.15 * Math.min(gapOf[to], 2);
}

// best[j][m] = cheapest way to place the first j lines ending at position m.
const best: number[][] = Array.from({ length: N + 1 }, () => new Array(M).fill(Infinity));
const from: number[][] = Array.from({ length: N + 1 }, () => new Array(M).fill(-1));
best[0][0] = 0;

for (let j = 1; j <= N; j++) {
  for (let m = j; m < M; m++) {
    // The last line must finish at the end; the others must not.
    if (j === N && m !== M - 1) continue;
    for (let k = j - 1; k < m; k++) {
      if (best[j - 1][k] === Infinity) continue;
      const c = best[j - 1][k] + cost(j - 1, k, m);
      if (c < best[j][m]) {
        best[j][m] = c;
        from[j][m] = k;
      }
    }
  }
}

if (best[N][M - 1] === Infinity) {
  console.error(`${slug}: แบ่งไม่ได้`);
  process.exit(1);
}

const cuts: number[] = [];
let at = M - 1;
for (let j = N; j >= 1; j--) {
  cuts.unshift(at);
  at = from[j][at];
}
cuts.unshift(0);

const timings: SegmentTiming[] = lines.map((line, i) => ({
  sourceIndex: line.sourceIndex,
  repeatIndex: line.repeatIndex,
  // Land just before the first syllable rather than a beat after it.
  startSec: Math.max(0, Number((pos[cuts[i]] - 0.12).toFixed(3))),
}));

const mmss = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

console.log(`\n${slug} — ${N} วรรค จาก ${candidates.length} รอยต่อที่เจอ\n`);
timings.forEach((t, i) => {
  const dur = pos[cuts[i + 1]] - pos[cuts[i]];
  const off = dur - want[i];
  console.log(
    `  ${String(i + 1).padStart(2)}. ${mmss(t.startSec)}  ${dur.toFixed(1)}s ` +
      `(คาด ${want[i].toFixed(1)}s, ${off >= 0 ? "+" : ""}${off.toFixed(1)})  ` +
      lines[i].text.slice(0, 40),
  );
});

if (dry) {
  console.log("\n--dry: ไม่ได้เขียนไฟล์");
} else {
  chant.audio.timings = timings;
  writeFileSync(chantPath, JSON.stringify(chant, null, 2) + "\n", "utf8");
  console.log(`\n✓ เขียน ${timings.length} timing ลง ${slug}.json`);
}
