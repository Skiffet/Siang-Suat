"use client";

import Link from "next/link";
import type { ChantWithAudio } from "@/lib/types";
import { formatTime } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/categories";
import { Cover } from "./Cover";
import { usePlayer } from "./player/PlayerProvider";
import { EqualizerIcon, PlayIcon } from "./Icons";

/**
 * A dense list row — the library and detail-page unit.
 *
 * The whole row is the play target; the title links through to the chant page,
 * which is the one place the full text lives.
 */
export function TrackRow({
  chant,
  queue,
  position,
}: {
  chant: ChantWithAudio;
  queue?: ChantWithAudio[];
  position?: number;
}) {
  const { play, toggle, isCurrent, playing, setExpanded } = usePlayer();
  const active = isCurrent(chant.slug);

  // Resuming a paused-but-current chant is as much an explicit "play this"
  // press as starting fresh, so it should bring the full-screen player back
  // too — only an actual pause should leave the browsing view alone.
  function pressPlay() {
    if (active && playing) toggle();
    else if (active) {
      toggle();
      setExpanded(true);
    } else play(chant, queue);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={pressPlay}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pressPlay();
        }
      }}
      className="group flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors duration-150 hover:bg-card-alt"
    >
      {position != null && (
        <span className="hidden w-5 shrink-0 text-right type-caption text-muted sm:block">
          {active && playing ? <EqualizerIcon size={14} /> : position}
        </span>
      )}

      <div className="relative shrink-0">
        <Cover src={chant.cover} alt={chant.title} sizes="48px" className="w-12" />
        <span className="absolute inset-0 grid place-items-center rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <PlayIcon size={16} className="text-ink" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/chant/${chant.slug}`}
          onClick={(e) => e.stopPropagation()}
          className={`block truncate type-caption-bold hover:underline ${
            active ? "text-green" : "text-ink"
          }`}
        >
          {chant.title}
        </Link>
        <p className="truncate type-small text-muted">
          {CATEGORY_LABELS[chant.category]} · {chant.subtitle ?? "เสียงสวด Podcast"}
        </p>
      </div>

      <span className="shrink-0 type-small text-muted">
        {chant.durationSec ? formatTime(chant.durationSec) : "เร็ว ๆ นี้"}
      </span>

    </div>
  );
}
