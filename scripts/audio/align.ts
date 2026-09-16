/**
 * Work out when each line of a chant is spoken, by listening for the pauses.
 *
 * Takes made outside `scripts/tts` arrive as finished audio with no timings,
 * so the player cannot highlight along. Recovering them by ear would mean
 * tapping through every line of every chant.
 *
 * Chanting makes that unnecessary. A recital separates its lines with pauses
 * far longer than anything inside a line, so the silences *are* the line
 * breaks. Split on them and, when the number of speech runs matches the number
 * of lines, the mapping is unambiguous.
 *
 * The gap that counts as a line break differs between takes, so rather than
 * fixing a threshold this sweeps them and keeps the one that produces exactly
 * as many runs as the chant has lines.
 *
 *   npx tsx scripts/audio/align.ts <slug> [--dry]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { decodeWav } from "../tts/dsp";
import type { Chant, SegmentTiming } from "../../src/lib/types";

const [slug, ...flags] = process.argv.slice(2);
const dry = flags.includes("--dry");
if (!slug) {
  console.error("usage: align.ts <slug> [--dry]");
  process.exit(1);
}

const chantPath = join(process.cwd(), "content", "chants", `${slug}.json`);
const chant = JSON.parse(readFileSync(chantPath, "utf8")) as Chant;
if (!chant.audio) {
  console.error(`${slug} has no hand-supplied audio; the pipeline owns its timings`);
  process.exit(1);
}

/** The lines the player will show, in order, with repeats expanded. */
const expected: { sourceIndex: number; repeatIndex: number; text: string }[] = [];
for (let r = 0; r < (chant.repeat ?? 1); r++) {
  chant.segments.forEach((seg, i) => {
    if (seg.kind !== "silence") {
      expected.push({ sourceIndex: i, repeatIndex: r, text: seg.text });
    }
  });
}

// The published file is AAC; afconvert is already a dependency of the trim and
// join steps, so reuse it rather than bringing in a decoder.
const audioPath = join(process.cwd(), "public", "audio", chant.audio.file);
const wavPath = join(tmpdir(), `${slug}.align.wav`);
execFileSync("/usr/bin/afconvert", ["-f", "WAVE", "-d", "LEI16", audioPath, wavPath]);
const { samples, sampleRate } = decodeWav(readFileSync(wavPath));

let peak = 0;
for (const s of samples) peak = Math.max(peak, Math.abs(s));

const WIN = Math.floor(sampleRate * 0.02);
/** Peak amplitude per 20ms window — the resolution everything else works at. */
const envelope: number[] = [];
for (let i = 0; i < samples.length; i += WIN) {
  let max = 0;
  for (let j = i; j < i + WIN && j < samples.length; j++) {
    max = Math.max(max, Math.abs(samples[j]));
  }
  envelope.push(max);
}

/** Runs of speech, given how quiet and how long a gap has to be to split lines. */
function runs(floorRatio: number, minGapSec: number) {
  const floor = peak * floorRatio;
  const minGap = Math.round(minGapSec / 0.02);
  const out: { start: number; end: number }[] = [];
  let from: number | null = null;
  let quiet = 0;

  envelope.forEach((v, i) => {
    if (v > floor) {
      if (from == null) from = i;
      quiet = 0;
    } else if (from != null) {
      quiet++;
      if (quiet >= minGap) {
        out.push({ start: from * 0.02, end: (i - quiet) * 0.02 });
        from = null;
      }
    }
  });
  if (from != null) out.push({ start: from * 0.02, end: envelope.length * 0.02 });
  return out;
}

// Sweep from a generous gap down to a tight one. Longer gaps split only at the
// clearest breaks, so the first setting that yields the right count is the one
// that split at line breaks and nowhere else.
let best: { start: number; end: number }[] | null = null;
let chosen = "";
outer: for (const floorRatio of [0.02, 0.03, 0.05, 0.015, 0.08]) {
  for (let gap = 1.6; gap >= 0.16; gap -= 0.02) {
    const found = runs(floorRatio, gap);
    if (found.length === expected.length) {
      best = found;
      chosen = `floor ${(floorRatio * 100).toFixed(1)}% ของ peak, ช่องว่าง ≥ ${gap.toFixed(2)}s`;
      break outer;
    }
  }
}

const mmss = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

if (!best) {
  console.error(`\n❌ ${slug}: จับคู่ไม่ได้ — ต้องการ ${expected.length} บรรทัด`);
  console.error("   จำนวนท่อนเสียงที่เจอในแต่ละการตั้งค่า:");
  for (let gap = 1.6; gap >= 0.2; gap -= 0.2) {
    console.error(`     ช่องว่าง ≥ ${gap.toFixed(1)}s → ${runs(0.02, gap).length} ท่อน`);
  }
  console.error("   แปลว่าเนื้อกับเสียงไม่ตรงกัน หรือบางบรรทัดสวดติดกันไม่เว้นจังหวะ");
  process.exit(1);
}

const timings: SegmentTiming[] = best.map((run, i) => ({
  sourceIndex: expected[i].sourceIndex,
  repeatIndex: expected[i].repeatIndex,
  // Back off slightly so the highlight lands just before the first syllable
  // rather than a beat after it.
  startSec: Math.max(0, Number((run.start - 0.12).toFixed(3))),
}));

console.log(`\n${slug} — ${chosen}\n`);
timings.forEach((t, i) => {
  console.log(
    `  ${String(i + 1).padStart(2)}. ${mmss(t.startSec)}  ` +
      `(${(best![i].end - best![i].start).toFixed(1)}s)  ${expected[i].text.slice(0, 46)}`,
  );
});

if (dry) {
  console.log("\n--dry: ไม่ได้เขียนไฟล์");
} else {
  chant.audio.timings = timings;
  writeFileSync(chantPath, JSON.stringify(chant, null, 2) + "\n", "utf8");
  console.log(`\n✓ เขียน ${timings.length} timing ลง ${slug}.json แล้ว`);
}
