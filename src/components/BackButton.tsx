"use client";

import { useRouter } from "next/navigation";
import { hasInAppHistory } from "@/lib/navHistory";
import { ChevronRightIcon } from "./Icons";

/**
 * The way out of a drill-in page — a chant, a playlist, the editor.
 *
 * Steps back through actual in-app history when there is any, so leaving a
 * chant opened from inside a playlist returns to that playlist rather than
 * jumping past it to the library. Only falls back to the playlists screen
 * when there's nothing to step back to — a chant opened straight from a
 * shared link, say, with no prior page in this tab at all.
 *
 * `overlay` (the default) floats it over a header's own art, for the pages
 * that have one. The editor doesn't, so it sits in normal flow there instead.
 */
export function BackButton({ overlay = true }: { overlay?: boolean }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => (hasInAppHistory() ? router.back() : router.push("/playlist"))}
      aria-label="ย้อนกลับ"
      className={`z-10 grid size-9 place-items-center rounded-full text-ink transition-colors ${
        overlay
          ? "absolute left-2 top-[calc(12px+env(safe-area-inset-top))] bg-base/40 backdrop-blur-sm hover:bg-base/70 lg:left-6"
          : "-ml-2 hover:bg-card"
      }`}
    >
      <ChevronRightIcon size={20} className="rotate-180" />
    </button>
  );
}
