"use client";

import Link from "next/link";
import type { ChantWithAudio } from "@/lib/types";
import { formatTime } from "@/lib/format";
import { Cover } from "./Cover";
import { PlayButton } from "./PlayButton";
import { usePlayer } from "./player/PlayerProvider";
import { EqualizerIcon, HeadphonesIcon } from "./Icons";

/**
 * One cover in a home rail.
 *
 * The green play button only appears on hover — at rest the card is art and a
 * title, so a row of them reads as content rather than as a row of controls.
 */
export function ChantCard({
  chant,
  queue,
  preload = false,
}: {
  chant: ChantWithAudio;
  queue?: ChantWithAudio[];
  preload?: boolean;
}) {
  const { isCurrent, playing } = usePlayer();
  const active = isCurrent(chant.slug);

  return (
    <Link
      href={`/chant/${chant.slug}`}
      className="group relative block w-[150px] shrink-0 rounded-lg p-2 transition-colors duration-200 hover:bg-card sm:w-[168px]"
    >
      <div className="relative">
        <Cover
          src={chant.cover}
          alt={chant.title}
          sizes="168px"
          preload={preload}
          className="shadow-[var(--shadow-elevated)]"
        />
        <div
          className={`absolute bottom-2 right-2 transition-all duration-200 ${
            active && playing
              ? "opacity-100"
              : "translate-y-1.5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          }`}
        >
          <PlayButton chant={chant} queue={queue} size={40} />
        </div>
      </div>

      <p
        className={`mt-3 type-caption-bold clamp-2 ${active ? "text-green" : "text-ink"}`}
      >
        {chant.title}
      </p>
      <p className="mt-1 flex items-center gap-1.5 type-small text-muted">
        {active && playing ? (
          <EqualizerIcon size={12} />
        ) : (
          <HeadphonesIcon size={13} />
        )}
        {chant.durationSec ? formatTime(chant.durationSec) : "เร็ว ๆ นี้"}
      </p>
    </Link>
  );
}
