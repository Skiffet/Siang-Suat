/**
 * Does an alignment hold up?
 *
 * Matching speech to lines is easy to get wrong in a way that still looks
 * plausible, so the result gets checked before it ships. The property a
 * correct alignment has and a wrong one does not: a line twice as long takes
 * about twice as long to say.
 *
 * The check is how far each line's measured length sits from what its text
 * length predicts, reported as a median so a couple of odd lines cannot
 * rescue or condemn the whole chant. Correlation is reported too, but only
 * where it means anything — a chant whose lines are all the same length has
 * no spread for a correlation to measure, and r collapses toward noise even
 * when every line is within a tenth of a second of where it belongs.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Chant } from "../../src/lib/types";

const slug = process.argv[2];
const chant = JSON.parse(
  readFileSync(join(process.cwd(), "content", "chants", `${slug}.json`), "utf8"),
) as Chant;
const timings = chant.audio?.timings;
if (!timings?.length) {
  console.error(`${slug}: ยังไม่มี timing`);
  process.exit(1);
}

const lines = chant.segments.filter((s) => s.kind !== "silence");
const total = chant.audio!.durationSec;
const charTotal = lines.reduce((n, l) => n + l.text.length, 0);

const rows = timings.map((t, i) => {
  const text = lines[t.sourceIndex]?.text ?? "";
  const dur = (timings[i + 1]?.startSec ?? total) - t.startSec;
  const want = (total * text.length) / charTotal;
  return { text, dur, want, rel: Math.abs(dur - want) / want };
});

const median = (xs: number[]) =>
  [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const medRel = median(rows.map((r) => r.rel));
const within = (limit: number) =>
  Math.round((rows.filter((r) => r.rel <= limit).length / rows.length) * 100);

console.log(`\n${slug} — ${rows.length} วรรค, ${total}s`);
console.log(`  คลาดจากที่ควรเป็น (ค่ากลาง): ${(medRel * 100).toFixed(0)}%`);
console.log(`  อยู่ในเกณฑ์ ±30%: ${within(0.3)}%   ±50%: ${within(0.5)}%`);

// Correlation only says something when the lines differ in length.
const chars = rows.map((r) => r.text.length);
const mc = chars.reduce((a, b) => a + b, 0) / chars.length;
const spread = Math.sqrt(chars.reduce((s, c) => s + (c - mc) ** 2, 0) / chars.length) / mc;
if (spread > 0.25) {
  const durs = rows.map((r) => r.dur);
  const md = durs.reduce((a, b) => a + b, 0) / durs.length;
  const cov = chars.reduce((s, c, i) => s + (c - mc) * (durs[i] - md), 0) / chars.length;
  const sc = Math.sqrt(chars.reduce((s, c) => s + (c - mc) ** 2, 0) / chars.length);
  const sd = Math.sqrt(durs.reduce((s, d) => s + (d - md) ** 2, 0) / durs.length);
  console.log(`  ความสัมพันธ์ ยาว↔นาน: r = ${(cov / (sc * sd)).toFixed(2)}`);
} else {
  console.log(`  (ทุกวรรคยาวใกล้กัน — ค่า r ใช้ตัดสินไม่ได้)`);
}

const ok = medRel <= 0.25 && within(0.5) >= 85;
const shaky = medRel <= 0.4 && within(0.5) >= 70;
console.log(`  ${ok ? "✓ จับคู่น่าเชื่อถือ" : shaky ? "~ พอใช้ ควรฟังตรวจ" : "✗ จับคู่ผิด — อย่าใช้"}`);

const worst = rows
  .map((r, i) => ({ ...r, i }))
  .filter((r) => r.rel > 0.6)
  .sort((a, b) => b.rel - a.rel);
if (worst.length) {
  console.log(`\n  วรรคที่คลาดมากที่สุด (${worst.length} จาก ${rows.length}):`);
  for (const w of worst.slice(0, 6)) {
    console.log(
      `    #${String(w.i + 1).padStart(2)} ได้ ${w.dur.toFixed(1)}s ควรเป็น ${w.want.toFixed(1)}s  ${w.text.slice(0, 36)}`,
    );
  }
}
