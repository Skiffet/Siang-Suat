/**
 * Does an alignment hold up?
 *
 * Matching the number of speech runs to the number of lines does not prove the
 * runs landed on the right lines — a split missed in one place and an extra
 * one made somewhere else still totals correctly. But a correct mapping has a
 * property a wrong one does not: a line twice as long takes about twice as
 * long to say. Comparing each run's length against its text's length is
 * therefore a check the alignment cannot fake.
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

const rows = timings.map((t, i) => {
  const next = timings[i + 1]?.startSec ?? total;
  return {
    text: lines[t.sourceIndex]?.text ?? "",
    chars: (lines[t.sourceIndex]?.text ?? "").length,
    dur: next - t.startSec,
    start: t.startSec,
  };
});

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const mc = mean(rows.map((r) => r.chars));
const md = mean(rows.map((r) => r.dur));
const cov = mean(rows.map((r) => (r.chars - mc) * (r.dur - md)));
const sc = Math.sqrt(mean(rows.map((r) => (r.chars - mc) ** 2)));
const sd = Math.sqrt(mean(rows.map((r) => (r.dur - md) ** 2)));
const r = cov / (sc * sd);

// Seconds per character, which should be roughly the same for every line.
const rates = rows.map((row) => row.dur / Math.max(1, row.chars));
const medianRate = [...rates].sort((a, b) => a - b)[Math.floor(rates.length / 2)];

console.log(`\n${slug} — ${rows.length} วรรค, ${total}s`);
console.log(`  ความสัมพันธ์ ความยาวข้อความ ↔ ความยาวเสียง: r = ${r.toFixed(2)}`);
console.log(`  ${r > 0.8 ? "✓ จับคู่น่าเชื่อถือ" : r > 0.5 ? "~ พอใช้ อาจมีบางวรรคเพี้ยน" : "✗ จับคู่ผิด — อย่าใช้"}`);

const odd = rows
  .map((row, i) => ({ ...row, i, ratio: rates[i] / medianRate }))
  .filter((row) => row.ratio > 2 || row.ratio < 0.4);

if (odd.length) {
  console.log(`\n  วรรคที่ผิดจังหวะชัดเจน (${odd.length} จาก ${rows.length}):`);
  for (const o of odd.slice(0, 8)) {
    console.log(
      `    #${String(o.i + 1).padStart(2)} ${o.dur.toFixed(1)}s สำหรับ ${o.chars} ตัวอักษร ` +
        `(${o.ratio.toFixed(1)}x ปกติ)  ${o.text.slice(0, 40)}`,
    );
  }
}
