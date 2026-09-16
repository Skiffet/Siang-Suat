/**
 * Build the chant audio.
 *
 *   npx tsx scripts/tts/generate.ts --dry            อ่านคำที่จะส่งให้ TTS โดยไม่เสียโควต้า
 *   npx tsx scripts/tts/generate.ts                  สร้างทุกบทที่ยังไม่มีเสียง
 *   npx tsx scripts/tts/generate.ts --only=metta     สร้างเฉพาะบทเดียว
 *   npx tsx scripts/tts/generate.ts --force          สร้างใหม่ทั้งหมดแม้เนื้อหาไม่เปลี่ยน
 *   TTS_PROVIDER=gemini npx tsx scripts/tts/generate.ts
 *
 * Audio is written to `public/audio/` together with a manifest the site reads
 * at build time. Chants whose text has not changed are skipped, so rerunning
 * this costs nothing.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { AudioManifest, Chant } from "../../src/lib/types";
import { loadLexicon } from "./lexicon";
import { buildPlan, planFingerprint, type SpeechPlan } from "./plan";
import { durationSec } from "./audio";
import type { TtsProvider } from "./providers/types";
import { edgeProvider } from "./providers/edge";
import { gcloudProvider } from "./providers/gcloud";
import { geminiProvider } from "./providers/gemini";

const CONTENT_DIR = join(process.cwd(), "content", "chants");
const OUT_DIR = join(process.cwd(), "public", "audio");
const MANIFEST_PATH = join(OUT_DIR, "manifest.json");

const PROVIDERS: Record<string, TtsProvider> = {
  edge: edgeProvider,
  gcloud: gcloudProvider,
  gemini: geminiProvider,
};

interface Args {
  provider: string;
  only?: string;
  force: boolean;
  dry: boolean;
}

function parseArgs(argv: string[]): Args {
  const get = (name: string) =>
    argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
  return {
    provider: get("provider") ?? process.env.TTS_PROVIDER ?? "edge",
    only: get("only"),
    force: argv.includes("--force"),
    dry: argv.includes("--dry"),
  };
}

function loadChants(only?: string): Chant[] {
  return readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(CONTENT_DIR, f), "utf8")) as Chant)
    .filter((c) => !only || c.slug === only);
}

function loadManifest(): AudioManifest {
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as AudioManifest;
  } catch {
    return {};
  }
}

/** Print what the synthesiser will actually be given. The cheapest way to catch
 *  a Pali word the lexicon has not covered yet. */
function printDryRun(chant: Chant, plan: SpeechPlan): void {
  console.log(`\n\x1b[1m${chant.title}\x1b[0m  (${chant.slug})`);
  if (chant.repeat && chant.repeat > 1) {
    console.log(`  สวด ${chant.repeat} จบ → ${plan.segments.length} วรรครวม`);
  }
  for (const seg of plan.segments) {
    if (seg.repeatIndex > 0) continue; // One pass is enough to review.
    const changed = seg.displayText !== seg.spokenText;
    const tag = seg.kind.padEnd(11);
    console.log(`  ${tag} ${seg.displayText}`);
    if (changed) console.log(`  ${" ".repeat(11)} \x1b[33m→ ${seg.spokenText}\x1b[0m`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const provider = PROVIDERS[args.provider];

  if (!provider) {
    console.error(
      `ไม่รู้จัก provider "${args.provider}" — เลือกได้: ${Object.keys(PROVIDERS).join(", ")}`,
    );
    process.exit(1);
  }

  const lexicon = loadLexicon();
  const chants = loadChants(args.only);

  if (chants.length === 0) {
    console.error(
      args.only ? `ไม่พบบทสวด "${args.only}"` : "ไม่พบไฟล์บทสวดใน content/chants",
    );
    process.exit(1);
  }

  if (args.dry) {
    console.log(`\x1b[2mทดลองอ่าน ${chants.length} บท — ยังไม่เรียก TTS\x1b[0m`);
    for (const chant of chants) printDryRun(chant, buildPlan(chant, lexicon));
    console.log(
      "\n\x1b[2mบรรทัดสีเหลืองคือคำที่ถูกเขียนคำอ่านทับจาก content/lexicon/pali.json\x1b[0m",
    );
    return;
  }

  if (!provider.isConfigured()) {
    console.error(`provider "${provider.id}" ยังตั้งค่าไม่ครบ`);
    console.error(`  ${provider.credentialHint}`);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const manifest = loadManifest();
  let built = 0;
  let skipped = 0;

  for (const chant of chants) {
    const plan = buildPlan(chant, lexicon);
    const hash = planFingerprint(plan, provider.id);
    const existing = manifest[chant.slug];

    if (!args.force && existing?.hash === hash && existsSync(join(OUT_DIR, existing.file))) {
      console.log(`\x1b[2m•\x1b[0m ${chant.title} — ไม่เปลี่ยน ข้าม`);
      skipped += 1;
      continue;
    }

    process.stdout.write(`\x1b[33m↻\x1b[0m ${chant.title} — กำลังสร้าง... `);
    const result = await provider.synthesize(plan);
    const seconds = durationSec(result.audio, result.ext);
    const file = `${chant.slug}.${result.ext}`;
    writeFileSync(join(OUT_DIR, file), result.audio);

    manifest[chant.slug] = {
      slug: chant.slug,
      file,
      durationSec: Number(seconds.toFixed(3)),
      bytes: result.audio.length,
      provider: provider.id,
      voice: result.voiceLabel,
      hash,
      generatedAt: new Date().toISOString(),
      timings: plan.segments.map((seg, i) => ({
        sourceIndex: seg.sourceIndex,
        repeatIndex: seg.repeatIndex,
        startSec: Number((result.segmentStarts?.[i] ?? 0).toFixed(3)),
      })),
      timingsExact: result.segmentStarts !== null,
    };

    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    console.log(
      `\x1b[32mเสร็จ\x1b[0m ${mins}:${String(secs).padStart(2, "0")} · ` +
        `${(result.audio.length / 1024).toFixed(0)} KB · ${result.voiceLabel}`,
    );
    built += 1;
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nสร้างใหม่ ${built} บท · ข้าม ${skipped} บท`);
  if (built > 0) {
    console.log(
      "\x1b[2mฟังตรวจคำบาลีก่อนปล่อยเสมอ — ถ้าอ่านผิดให้เพิ่มคำอ่านใน content/lexicon/pali.json\x1b[0m",
    );
  }
}

main().catch((err) => {
  console.error(`\n\x1b[31mล้มเหลว:\x1b[0m ${err.message}`);
  process.exit(1);
});
