import Link from "next/link";
import { LotusMark } from "./Icons";

/** The wordmark. Gold is reserved for this and nothing else. */
export function Brand({ tagline = false }: { tagline?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-gold">
      <LotusMark size={30} />
      <span>
        <span className="block type-section leading-none text-gold">เสียงสวด</span>
        {tagline && (
          <span className="mt-1 block type-small text-muted">
            Podcast สวดมนต์เพื่อชีวิตที่สงบกว่าเดิม
          </span>
        )}
      </span>
    </Link>
  );
}
