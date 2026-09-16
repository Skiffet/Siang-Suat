import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { VoiceCompare, type Sample } from "@/components/VoiceCompare";

export const metadata = { title: "เทียบเสียง" };

const INDEX_PATH = join(process.cwd(), "public", "audio", "test", "index.json");

export default function TestPage() {
  const samples: Sample[] = existsSync(INDEX_PATH)
    ? (JSON.parse(readFileSync(INDEX_PATH, "utf8")) as Sample[])
    : [];

  return (
    <main className="px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="type-section">เทียบเสียง</h1>
        <p className="type-caption text-muted mt-1">
          บทเดียวกัน ปรุงคนละแบบ — เลือกแบบที่ใกล้เสียงพระสวดที่สุด
        </p>
        <p className="type-pali mt-6 border-l-2 border-green pl-4">
          นะโม ตัสสะ ภะคะวะโต อะระหะโต สัมมาสัมพุทธัสสะ
        </p>
      </header>

      {samples.length > 0 ? (
        <VoiceCompare samples={samples} />
      ) : (
        <p className="type-caption text-muted">
          ยังไม่มีไฟล์ทดสอบ — รัน <code>npm run tts:try</code> ก่อน
        </p>
      )}

      <p className="type-caption text-muted mt-8 rounded-xl border border-line bg-surface px-4 py-3">
        ปรับสูตรได้ที่ <code>scripts/tts/try-voice.ts</code> แล้วรัน{" "}
        <code>npm run tts:try</code> ใหม่
      </p>
    </main>
  );
}
