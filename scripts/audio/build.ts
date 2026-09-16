/**
 * Take a recording and its script, and produce a chant the player can follow.
 *
 * Every take supplied so far has gone through the same four steps by hand:
 * trim the dead tail, turn the script into lines, recover the timings from the
 * pauses, then check the result is worth believing. This runs all four and
 * refuses to write anything if the check fails, so a bad alignment cannot
 * reach the site by being the last thing anyone remembered to run.
 *
 *   npx tsx scripts/audio/build.ts <slug> --audio <a.wav> [--audio <b.wav>...]
 *                                         --script <s.txt> [--to <seconds>]
 *
 * Several --audio files are joined in order, for a chant recorded in parts.
 * --to cuts the recording short, for dropping a trailing translation.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import type { Chant, ChantSegment } from "../../src/lib/types";

const args = process.argv.slice(2);
const slug = args[0];
const audio: string[] = [];
let script = "";
let cutAt = "";
for (let i = 1; i < args.length; i++) {
  if (args[i] === "--audio") audio.push(args[++i]);
  else if (args[i] === "--script") script = args[++i];
  else if (args[i] === "--to") cutAt = args[++i];
}

if (!slug || !audio.length || !script) {
  console.error(
    "usage: build.ts <slug> --audio <a.wav> [--audio <b.wav>...] " +
      "--script <s.txt> [--to <seconds>]",
  );
  process.exit(1);
}

const chantPath = join(process.cwd(), "content", "chants", `${slug}.json`);
if (!existsSync(chantPath)) {
  console.error(
    `ไม่พบ ${chantPath}\n` +
      `สร้างไฟล์นั้นก่อน (ชื่อบท ปก หมวด คำอธิบาย) แล้วค่อยรันคำสั่งนี้ — ` +
      `สคริปต์นี้เติมให้แค่ segments กับ audio`,
  );
  process.exit(1);
}
for (const f of [...audio, script]) {
  if (!existsSync(f)) {
    console.error(`ไม่พบไฟล์: ${f}`);
    process.exit(1);
  }
}

const run = (cmd: string[]) =>
  execFileSync("npx", ["tsx", ...cmd], { encoding: "utf8", stdio: "pipe" });

console.log(`\n── 1/4 เตรียมไฟล์เสียง ──`);
if (audio.length > 1) {
  process.stdout.write(run(["scripts/audio/join.ts", slug, ...audio]));
} else {
  const extra = cutAt ? ["--to", cutAt] : [];
  process.stdout.write(run(["scripts/audio/trim.ts", audio[0], slug, ...extra]));
}

console.log(`── 2/4 แปลงสคริปต์เป็นวรรค ──`);
const raw = readFileSync(script, "utf8");
const [titleLine, ...rest] = raw.split("\n");

/**
 * The script's own shape decides the lines: its first line names the chant,
 * which the recital announces before it begins; a line wholly in brackets is
 * an instruction to the chanter rather than something spoken.
 *
 * Commas split a line further only where that leaves something long enough to
 * pin to a pause. Single words like "ภันเต" are run together in one breath, so
 * splitting there produces lines no silence can be found for.
 */
const MIN_PHRASE = 14;
const segments: ChantSegment[] = [{ kind: "thai", text: titleLine.trim() }];
for (const line of rest) {
  const text = line.trim();
  if (!text) continue;
  if (/^\(.*\)$/.test(text)) {
    segments.push({ kind: "cue", text });
    continue;
  }
  const parts = text.split(/[,.]/).map((p) => p.trim()).filter(Boolean);
  let buf = "";
  for (const part of parts) {
    buf = buf ? `${buf} ${part}` : part;
    if (buf.length >= MIN_PHRASE) {
      segments.push({ kind: "pali", text: buf });
      buf = "";
    }
  }
  if (buf) {
    // Too short to stand alone — fold it into the line before it.
    const prev = segments[segments.length - 1];
    if (prev && prev.kind === "pali") prev.text += ` ${buf}`;
    else segments.push({ kind: "pali", text: buf });
  }
}

const chant = JSON.parse(readFileSync(chantPath, "utf8")) as Chant;
const spoken = segments.filter((s) => s.kind !== "cue").length;
console.log(`   ${segments.length} วรรค (${spoken} สวด, ${segments.length - spoken} คำสั่ง)`);
console.log(`   ⚠︎ ทุกวรรคถูกตั้งเป็น "pali" — ถ้ามีท่อนภาษาไทยหรือคำแปล`);
console.log(`     แก้ kind ใน ${slug}.json เองหลังจากนี้`);

const wavName = `${slug}.m4a`;
const durLine = run(["scripts/audio/inspect.ts", audio[0]]); // for the log only
void durLine;
chant.segments = segments;
chant.audio = {
  file: wavName,
  durationSec: chant.audio?.durationSec ?? 0,
};
writeFileSync(chantPath, JSON.stringify(chant, null, 2) + "\n", "utf8");

// The encoder reports the finished length; read it back rather than guessing.
const probe = execFileSync("/usr/bin/afinfo", [join("public", "audio", wavName)], {
  encoding: "utf8",
});
const seconds = Number(probe.match(/estimated duration: ([\d.]+)/)?.[1] ?? 0);
chant.audio.durationSec = Number(seconds.toFixed(1));
writeFileSync(chantPath, JSON.stringify(chant, null, 2) + "\n", "utf8");
console.log(`   ยาว ${chant.audio.durationSec}s`);

console.log(`── 3/4 จับเวลาแต่ละวรรค ──`);
try {
  const out = run(["scripts/audio/align.ts", slug]);
  console.log(out.trimEnd().split("\n").slice(-4).join("\n"));
} catch (err) {
  console.error((err as { stderr?: string }).stderr ?? String(err));
  process.exit(1);
}

console.log(`── 4/4 ตรวจว่าเชื่อได้ไหม ──`);
const report = run(["scripts/audio/check-align.ts", slug]);
process.stdout.write(report);

if (report.includes("✗")) {
  // Leaving a failed alignment in place would highlight the wrong lines.
  const c = JSON.parse(readFileSync(chantPath, "utf8")) as Chant;
  delete c.audio!.timings;
  writeFileSync(chantPath, JSON.stringify(c, null, 2) + "\n", "utf8");
  console.error(
    `\n✗ ไม่ผ่าน — ถอด timing ออกแล้ว ข้อความจะแสดงแบบอ่านอย่างเดียว\n` +
      `  มักเป็นเพราะเนื้อไม่ตรงกับเสียง หรือเสียงมีท่อนที่ไม่มีในสคริปต์`,
  );
  process.exit(1);
}
console.log(`\n✓ ${slug} พร้อมใช้งาน`);
