"use client";

import { useMemo } from "react";
import type { ChantWithAudio } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/categories";
import { formatDurationLong } from "@/lib/format";
import { Cover } from "./Cover";
import { PlayButton } from "./PlayButton";
import { Rail } from "./Rail";
import { Transcript } from "./Transcript";
import { DownloadIcon, MoreIcon, PlusIcon, ShareIcon } from "./Icons";

/**
 * A chant's own page: the art, the controls, and the text.
 *
 * The header gradient is tinted by nothing but the art sitting on top of it —
 * the surfaces underneath stay achromatic, as the system requires.
 */
export function ChantDetail({
  chant,
  related,
}: {
  chant: ChantWithAudio;
  related: ChantWithAudio[];
}) {
  const tags = useMemo(() => chant.tags ?? [], [chant.tags]);

  return (
    <article>
      <header className="relative px-4 pb-6 pt-[calc(24px+env(safe-area-inset-top))] lg:px-8 lg:pt-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-25 blur-3xl"
          style={{
            backgroundImage: `url(/covers/${chant.cover}.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
          <Cover
            src={chant.cover}
            alt={chant.title}
            sizes="(min-width: 640px) 220px, 55vw"
            preload
            className="w-40 shrink-0 self-center shadow-[var(--shadow-dialog)] sm:w-[220px] sm:self-auto"
          />

          <div className="min-w-0 flex-1">
            <p className="type-micro uppercase tracking-[1.4px] text-muted">
              บทสวด · {CATEGORY_LABELS[chant.category]}
            </p>
            <h1 className="mt-2 type-section text-ink sm:text-[40px] sm:leading-tight">
              {chant.title}
            </h1>
            {chant.subtitle && (
              <p className="mt-2 type-pali text-near-white">{chant.subtitle}</p>
            )}
            <p className="mt-3 type-small text-muted">
              เสียงสวด Podcast · {formatDurationLong(chant.durationSec)}
              {chant.audioUrl ? "" : " · ยังไม่มีไฟล์เสียง"}
            </p>
          </div>
        </div>

        <div className="relative mt-6 flex items-center gap-4">
          <PlayButton chant={chant} size={56} />
          <button
            type="button"
            aria-label="บันทึกลงรายการโปรด"
            className="grid size-9 place-items-center rounded-full border border-line-light text-muted transition-colors hover:text-ink"
          >
            <PlusIcon size={18} />
          </button>
          <button
            type="button"
            aria-label="ดาวน์โหลดไว้ฟังออฟไลน์"
            className="text-muted transition-colors hover:text-ink"
          >
            <DownloadIcon size={22} />
          </button>
          <button
            type="button"
            aria-label="แชร์"
            className="text-muted transition-colors hover:text-ink"
          >
            <ShareIcon size={22} />
          </button>
          <button
            type="button"
            aria-label="ตัวเลือกเพิ่มเติม"
            className="text-muted transition-colors hover:text-ink"
          >
            <MoreIcon size={22} />
          </button>
        </div>
      </header>

      <div className="px-4 lg:px-8">
        <p className="max-w-[68ch] type-caption text-muted">{chant.description}</p>

        {tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-mid px-2 py-[2px] text-[10.5px] font-semibold capitalize leading-[1.33] text-ink"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        <Transcript chant={chant} />
      </div>

      {related.length > 0 && (
        <div className="mt-10 lg:px-8">
          <Rail title="บทสวดที่เกี่ยวข้อง" items={related} />
        </div>
      )}
    </article>
  );
}
