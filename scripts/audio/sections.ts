/**
 * Find the structural breaks in a take.
 *
 * A chant generated in one pass still has its sections separated by pauses
 * much longer than the gaps between lines. Listing the longest silences shows
 * where a recital changes gear — Pali giving way to its translation, say — so
 * a section can be cut without hearing the file.
 *
 *   npx tsx scripts/audio/sections.ts <file.wav> [how-many]
 */
import { readFileSync } from "node:fs";
import { decodeWav } from "../tts/dsp";

const path = process.argv[2];
const top = Number(process.argv[3] ?? 8);
const { samples, sampleRate } = decodeWav(readFileSync(path));

let peak = 0;
for (const s of samples) peak = Math.max(peak, Math.abs(s));
const floor = peak * 0.02;
const win = Math.floor(sampleRate * 0.02);

/** Walk 20ms windows and collect every stretch that stays under the floor. */
const gaps: { start: number; end: number }[] = [];
let runFrom: number | null = null;
for (let i = 0; i < samples.length; i += win) {
  let max = 0;
  for (let j = i; j < i + win && j < samples.length; j++) {
    max = Math.max(max, Math.abs(samples[j]));
  }
  if (max <= floor) {
    if (runFrom == null) runFrom = i;
  } else if (runFrom != null) {
    gaps.push({ start: runFrom / sampleRate, end: i / sampleRate });
    runFrom = null;
  }
}
if (runFrom != null) gaps.push({ start: runFrom / sampleRate, end: samples.length / sampleRate });

const mmss = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const total = samples.length / sampleRate;
console.log(`${path}\nยาว ${mmss(total)} (${total.toFixed(1)}s)\n`);
console.log(`ช่วงเงียบยาวที่สุด ${top} จุด — น่าจะเป็นรอยต่อระหว่างท่อน:`);

[...gaps]
  .sort((a, b) => b.end - b.start - (a.end - a.start))
  .slice(0, top)
  .sort((a, b) => a.start - b.start)
  .forEach((g) => {
    const mid = (g.start + g.end) / 2;
    console.log(
      `  เงียบ ${(g.end - g.start).toFixed(2)}s ที่ ${mmss(g.start)}–${mmss(g.end)}` +
        `   → ตัดตรงนี้ใช้ ${mid.toFixed(1)}`,
    );
  });
