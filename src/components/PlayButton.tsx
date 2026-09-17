"use client";

import type { ChantWithAudio } from "@/lib/types";
import { usePlayer } from "./player/PlayerProvider";
import { PauseIcon, PlayIcon } from "./Icons";

/**
 * The green play control — DESIGN.md's single functional use of the brand
 * colour. Circular, black icon on green, and it flips to pause once the chant
 * it belongs to is the one playing.
 */
export function PlayButton({
  chant,
  queue,
  size = 48,
  className = "",
}: {
  chant: ChantWithAudio;
  queue?: ChantWithAudio[];
  size?: number;
  className?: string;
}) {
  const { play, toggle, isCurrent, playing, setExpanded } = usePlayer();
  const active = isCurrent(chant.slug);
  const showPause = active && playing;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (showPause) toggle();
        else if (active) {
          // Resuming a chant that's already loaded but paused — this is as
          // much an explicit "play this" press as starting fresh, so it
          // should bring the full-screen player back too.
          toggle();
          setExpanded(true);
        } else play(chant, queue);
      }}
      aria-label={showPause ? `หยุด ${chant.title}` : `เล่น ${chant.title}`}
      style={{ width: size, height: size }}
      className={`grid shrink-0 place-items-center rounded-full bg-green text-on-green shadow-[var(--shadow-elevated)] transition-transform duration-150 hover:scale-105 active:scale-95 ${className}`}
    >
      {showPause ? (
        <PauseIcon size={size * 0.42} />
      ) : (
        <PlayIcon size={size * 0.42} className="translate-x-[1px]" />
      )}
    </button>
  );
}
