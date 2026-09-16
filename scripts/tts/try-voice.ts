/**
 * Render one short line through several voice treatments so they can be
 * compared by ear.
 *
 *   npm run tts:try                       เสียงจาก Edge (ฟรี ไม่ต้องมี key)
 *   GEMINI_API_KEY=xxx npm run tts:try -- --provider=gemini
 *
 * Writes to `public/audio/test/` and is listened to at /test. Nothing here
 * touches the real chant audio — this is only for choosing a direction.
 *
 * The two providers are steered in completely different ways, which is the
 * point of comparing them. Edge takes numbers — a rate and a pitch — and the
 * chanting character has to be built afterwards with DSP. Gemini takes an
 * instruction in words, so the delivery itself can be asked for: flat tone,
 * held syllables, the cadence of a temple hall. Numbers cannot reach that, so
 * the Gemini variants lean on the wording and use only a little reverb.
 *
 * Decoding Edge's MP3 leans on macOS's `afconvert`, which keeps the pipeline
 * free of an ffmpeg dependency at the cost of this one path being macOS-only.
 * Gemini returns PCM, so it needs no decoder at all.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { synthesizeLine, trimPadding } from "./providers/edge";
import { geminiProvider } from "./providers/gemini";
import type { SpeechPlan } from "./plan";
import {
  decodeWav,
  encodeWav,
  layer,
  lowpass,
  normalise,
  padTail,
  reverb,
  type ChorusVoice,
  type Pcm,
} from "./dsp";

const OUT_DIR = join(process.cwd(), "public", "audio", "test");

/** One round of the opening homage — short, and the line everyone knows. */
const LINE = "นะ โม ตัด สะ พะ คะ วะ โต อะ ระ หะ โต สำ มา สำ พุด ทัด สะ";

const NIWAT = "th-TH-NiwatNeural";
const PREMWADEE = "th-TH-PremwadeeNeural";

/** Three voices a beat apart — a small group rather than a crowd. */
const SMALL_GROUP: ChorusVoice[] = [
  { detune: 1.0, delayMs: 0, gain: 1.0 },
  { detune: 0.994, delayMs: 45, gain: 0.75 },
  { detune: 1.006, delayMs: 85, gain: 0.65 },
];

/** Five voices, wider spread — a hall of monks. */
const LARGE_GROUP: ChorusVoice[] = [
  { detune: 1.0, delayMs: 0, gain: 1.0 },
  { detune: 0.991, delayMs: 40, gain: 0.8 },
  { detune: 1.008, delayMs: 75, gain: 0.7 },
  { detune: 0.996, delayMs: 120, gain: 0.6 },
  { detune: 1.013, delayMs: 165, gain: 0.5 },
];

interface Variant {
  name: string;
  note: string;
  voice: string;
  rate: number;
  /** Semitones. Negative is deeper. */
  pitch: number;
  /** Gemini only: how the line should be delivered, in words. */
  style?: string;
  treat: (pcm: Pcm) => Pcm;
}

const EDGE_VARIANTS: Variant[] = [
  {
    name: "01-ดิบ",
    note: "เสียงชาย Niwat ไม่ปรุงอะไรเลย — ไว้เทียบว่าดีขึ้นแค่ไหน",
    voice: NIWAT, rate: 0.75, pitch: 0,
    treat: (p) => normalise(p),
  },
  {
    name: "02-ทุ้ม",
    note: "ลดเสียงลง 6 เสียง ให้ทุ้มขึ้น ยังไม่ใส่ห้อง",
    voice: NIWAT, rate: 0.72, pitch: -6,
    treat: (p) => normalise(p),
  },
  {
    name: "03-ในศาลา",
    note: "ทุ้ม + เสียงก้องแบบศาลาเล็ก",
    voice: NIWAT, rate: 0.72, pitch: -6,
    treat: (p) => normalise(reverb(padTail(p, 1800), { size: 0.55, wet: 0.45, damping: 0.35 })),
  },
  {
    name: "04-สวดหมู่",
    note: "ทุ้ม + สวดพร้อมกัน 3 รูป + ก้องแบบศาลา",
    voice: NIWAT, rate: 0.7, pitch: -7,
    treat: (p) =>
      normalise(reverb(padTail(layer(p, SMALL_GROUP), 2000), { size: 0.6, wet: 0.5, damping: 0.35 })),
  },
  {
    name: "05-ในวิหาร",
    note: "ทุ้มมาก + สวดพร้อมกัน 5 รูป + ก้องแบบวิหารใหญ่ + ตัดเสียงแหลม",
    voice: NIWAT, rate: 0.68, pitch: -9,
    treat: (p) =>
      normalise(
        lowpass(
          reverb(padTail(layer(p, LARGE_GROUP), 2600), { size: 0.85, wet: 0.62, damping: 0.45 }),
          5200,
        ),
      ),
  },
  {
    name: "06-หญิงสวดหมู่",
    note: "เสียงหญิง Premwadee ปรุงแบบเดียวกับ 04 — เผื่อชอบแนวแม่ชี",
    voice: PREMWADEE, rate: 0.7, pitch: -5,
    treat: (p) =>
      normalise(reverb(padTail(layer(p, SMALL_GROUP), 2000), { size: 0.6, wet: 0.5, damping: 0.35 })),
  },
];

/**
 * Gemini is directed in language rather than numbers, so each variant is a
 * different way of describing the delivery.
 *
 * Nothing is processed afterwards. An earlier set added a hall and stacked
 * voices, which buried the thing being judged — what matters is whether the
 * model chants, and that has to be audible on its own.
 *
 * The instruction that produced a usable tone but far too slow a tempo asked
 * for held syllables. Real daily chanting moves at a steady working pace, so
 * that wording is gone and several ways of pinning the tempo are tried instead.
 */
const CHANT_BASE =
  "สวดมนต์แบบพระสงฆ์ไทยทำวัตร ใช้เสียงชายทุ้ม " +
  "โทนเสียงเรียบระดับเดียวตลอด ไม่ขึ้นลงแบบพูดคุย ไม่เน้นคำใดเป็นพิเศษ " +
  "จังหวะสม่ำเสมอเป็นธรรมชาติแบบที่พระสวดกันจริงในวัด " +
  "ไม่ต้องลากเสียงให้ยาว ไม่ต้องช้าเป็นพิเศษ สวดให้ลื่นไหลต่อเนื่อง";

/** Every one of these is the raw model output, levelled and nothing else. */
const DRY = (p: Pcm) => normalise(p);

const GEMINI_VARIANTS: Variant[] = [
  {
    name: "N1-ปกติ",
    note: "เสียง Charon จังหวะทำวัตรปกติ ไม่ปรุงอะไรเลย",
    voice: "Charon", rate: 1, pitch: 0,
    style: CHANT_BASE,
    treat: DRY,
  },
  {
    name: "N2-บอกเวลา",
    note: "แบบ N1 แต่บอกโมเดลตรงๆ ว่าให้จบใน 7 วินาที",
    voice: "Charon", rate: 1, pitch: 0,
    style: CHANT_BASE + " สวดบทนี้ให้จบภายในประมาณ 7 วินาที",
    treat: DRY,
  },
  {
    name: "N3-คล่อง",
    note: "แบบ N1 แต่สั่งให้คล่องแบบพระที่สวดจนชิน",
    voice: "Charon", rate: 1, pitch: 0,
    style:
      CHANT_BASE +
      " สวดคล่องแบบพระที่สวดบทนี้จนขึ้นใจแล้ว ไม่ลังเล ไม่หยุดคิด",
    treat: DRY,
  },
  {
    name: "N4-เสียงแก่",
    note: "เสียง Gacrux (สุ้มเสียงผู้สูงวัย) จังหวะปกติ",
    voice: "Gacrux", rate: 1, pitch: 0,
    style: CHANT_BASE,
    treat: DRY,
  },
  {
    name: "N5-โทนเรียบ",
    note: "เสียง Schedar (โทนสม่ำเสมอที่สุด) จังหวะปกติ",
    voice: "Schedar", rate: 1, pitch: 0,
    style: CHANT_BASE,
    treat: DRY,
  },
  {
    name: "N6-หนักแน่น",
    note: "เสียง Orus (หนักแน่น) จังหวะปกติ",
    voice: "Orus", rate: 1, pitch: 0,
    style: CHANT_BASE,
    treat: DRY,
  },
];

/** Gemini returns PCM at a fixed rate, so its WAV only needs unwrapping. */
function geminiPcm(text: string, voice: string, style: string): Promise<Pcm> {
  const plan: SpeechPlan = {
    slug: "try",
    pitch: 0,
    voiceName: voice,
    styleHint: style,
    segments: [
      {
        sourceIndex: 0,
        repeatIndex: 0,
        kind: "pali",
        displayText: text,
        spokenText: text,
        pauseAfterMs: 0,
        rate: 1,
      },
    ],
  };
  return geminiProvider.synthesize(plan).then((r) => decodeWav(r.audio));
}

/** MP3 in, mono 16-bit PCM out, by way of a temp file afconvert can read. */
function decodeMp3(mp3: Buffer): Pcm {
  const dir = join(tmpdir(), `chant-${process.pid}-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  const src = join(dir, "in.mp3");
  const dst = join(dir, "out.wav");
  try {
    writeFileSync(src, mp3);
    execFileSync("afconvert", ["-f", "WAVE", "-d", "LEI16", src, dst], {
      stdio: "pipe",
    });
    return decodeWav(readFileSync(dst));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Gemini's free tier allows three requests a minute, and the whole set trips it
 * on the fourth. Spacing the calls costs a couple of minutes and keeps a run
 * from dying halfway with samples already paid for.
 */
const GEMINI_GAP_MS = 21_000;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const provider = process.argv.includes("--provider=gemini") ? "gemini" : "edge";
  /** `--only=N5,N6` re-renders part of a set without spending quota on the rest. */
  const only = process.argv
    .find((a) => a.startsWith("--only="))
    ?.slice("--only=".length)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (provider === "gemini" && !geminiProvider.isConfigured()) {
    console.error("provider \"gemini\" ยังตั้งค่าไม่ครบ");
    console.error(`  ${geminiProvider.credentialHint}`);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  /** Rebuild the listing from what is already rendered, spending no quota. */
  const reindexOnly = process.argv.includes("--reindex");

  const all = provider === "gemini" ? GEMINI_VARIANTS : EDGE_VARIANTS;
  const variants = only
    ? all.filter((v) => only.some((o) => v.name.startsWith(o)))
    : all;
  if (variants.length === 0) {
    console.error(`ไม่พบแบบที่ชื่อขึ้นต้นด้วย: ${only?.join(", ")}`);
    process.exit(1);
  }
  console.log(`\x1b[2mเทียบเสียงจาก ${provider} — ${variants.length} แบบ\x1b[0m\n`);

  // One synthesis serves every variant that asks for the same delivery; the
  // treatments that differ only in DSP then cost nothing extra.
  const cache = new Map<string, Pcm>();
  const index: { file: string; name: string; note: string; seconds: number }[] = [];

  for (const v of variants) {
    process.stdout.write(`\x1b[33m↻\x1b[0m ${v.name.padEnd(16)} `);

    const file = `${v.name}.wav`;
    const path = join(OUT_DIR, file);

    if (reindexOnly || (only === undefined && existsSync(path) && process.argv.includes("--keep"))) {
      if (!existsSync(path)) {
        console.log("\x1b[2mยังไม่มีไฟล์ ข้าม\x1b[0m");
        continue;
      }
      const pcm = decodeWav(readFileSync(path));
      const seconds = pcm.samples.length / pcm.sampleRate;
      index.push({ file, name: v.name, note: v.note, seconds: Number(seconds.toFixed(2)) });
      console.log(`\x1b[2mใช้ไฟล์เดิม\x1b[0m ${seconds.toFixed(1)}s`);
      continue;
    }

    try {
      const key = `${v.voice}|${v.rate}|${v.pitch}|${v.style ?? ""}`;
      let raw = cache.get(key);
      if (!raw) {
        if (provider === "gemini" && cache.size > 0) await wait(GEMINI_GAP_MS);
        raw =
          provider === "gemini"
            ? await geminiPcm(LINE, v.voice, v.style ?? "")
            : decodeMp3(
                trimPadding(await synthesizeLine(LINE, v.rate, v.pitch, v.voice), v.rate),
              );
        cache.set(key, raw);
      }

      const treated = v.treat(raw);
      const wav = encodeWav(treated);
      writeFileSync(path, wav);

      const seconds = treated.samples.length / treated.sampleRate;
      index.push({ file, name: v.name, note: v.note, seconds: Number(seconds.toFixed(2)) });
      console.log(
        `\x1b[32mเสร็จ\x1b[0m ${seconds.toFixed(1)}s · ${(wav.length / 1024).toFixed(0)} KB`,
      );
    } catch (err) {
      // One variant failing — usually a quota wall — must not discard the
      // samples already rendered in this run.
      const message = err instanceof Error ? err.message : String(err);
      const quota = message.includes("RESOURCE_EXHAUSTED") || message.includes("429");
      console.log(`\x1b[31m${quota ? "โควต้าหมด" : "ล้มเหลว"}\x1b[0m`);
      if (existsSync(path)) {
        const pcm = decodeWav(readFileSync(path));
        index.push({
          file, name: v.name, note: v.note,
          seconds: Number((pcm.samples.length / pcm.sampleRate).toFixed(2)),
        });
      }
      if (quota) continue;
      throw err;
    }
  }

  // Keep whatever the other provider left behind, so Edge and Gemini can be
  // compared side by side rather than one replacing the other.
  const indexPath = join(OUT_DIR, "index.json");
  let merged = index;
  if (existsSync(indexPath)) {
    const previous = JSON.parse(readFileSync(indexPath, "utf8")) as typeof index;
    const fresh = new Set(index.map((e) => e.file));
    merged = [...previous.filter((e) => !fresh.has(e.file)), ...index].sort((a, b) =>
      a.name.localeCompare(b.name, "th"),
    );
  }
  writeFileSync(indexPath, JSON.stringify(merged, null, 2) + "\n");
  console.log(`\nเปิด http://localhost:3000/test เพื่อฟังเทียบกัน (${merged.length} แบบ)`);
}

main().catch((err) => {
  console.error(`\n\x1b[31mล้มเหลว:\x1b[0m ${err.message}`);
  process.exit(1);
});
