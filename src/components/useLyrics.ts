"use client";

import { useMemo } from "react";
import type { ChantWithAudio, SegmentKind } from "@/lib/types";
import { usePlayer } from "./player/PlayerProvider";

export interface LyricLine {
  /** Null when the chant has no timings — the line cannot be seeked to. */
  startSec: number | null;
  text: string;
  kind: SegmentKind;
}

/**
 * The chant's lines and which one is being spoken.
 *
 * Shared by the reading panel on the chant page and the follow-along view
 * inside the player, so both stay on the same line as each other.
 */
export function useLyrics(chant: ChantWithAudio) {
  const { time, isCurrent, seek, play } = usePlayer();
  const active = isCurrent(chant.slug);
  const synced = chant.timings.length > 0;

  /** Repeats become their own rows, so a three-round chant scrolls three times. */
  const lines = useMemo<LyricLine[]>(() => {
    if (synced) {
      return chant.timings.map((t) => ({
        startSec: t.startSec,
        text: chant.segments[t.sourceIndex]?.text ?? "",
        kind: chant.segments[t.sourceIndex]?.kind ?? "thai",
      }));
    }
    return chant.segments
      .filter((s) => s.kind !== "silence")
      .map((s) => ({ startSec: null, text: s.text, kind: s.kind }));
  }, [chant, synced]);

  const activeIndex = useMemo(() => {
    if (!active || !synced) return -1;
    let found = -1;
    for (let i = 0; i < lines.length; i++) {
      const start = lines[i].startSec;
      if (start == null) break;
      if (time + 0.05 >= start) found = i;
      else break;
    }
    return found;
  }, [active, synced, lines, time]);

  /** Jump to a line, starting the chant first if it is not the one playing. */
  function goTo(line: LyricLine) {
    if (line.startSec == null) return;
    if (active) {
      seek(line.startSec);
      return;
    }
    play(chant);
    // The element needs a source before a seek will stick.
    setTimeout(() => seek(line.startSec!), 120);
  }

  return { lines, activeIndex, synced, active, goTo };
}
