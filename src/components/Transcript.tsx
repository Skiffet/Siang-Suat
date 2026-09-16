"use client";

import { useEffect, useMemo, useRef } from "react";
import type { ChantWithAudio } from "@/lib/types";
import { usePlayer } from "./player/PlayerProvider";

/**
 * The chant text, read along with the audio.
 *
 * When the pipeline reported line timings, the line being spoken lifts to full
 * white and the rest dim back — and clicking any line seeks to it. Takes made
 * outside the pipeline have no timings, so the same text renders as a plain
 * reading panel rather than pretending to be in sync.
 */
export function Transcript({ chant }: { chant: ChantWithAudio }) {
  const { time, isCurrent, seek, play } = usePlayer();
  const active = isCurrent(chant.slug);
  const listRef = useRef<HTMLOListElement>(null);

  /** Repeats become their own rows, so a three-round chant scrolls three times. */
  const lines = useMemo(() => {
    if (chant.timings.length > 0) {
      return chant.timings.map((t) => ({
        startSec: t.startSec,
        text: chant.segments[t.sourceIndex]?.text ?? "",
        kind: chant.segments[t.sourceIndex]?.kind ?? "thai",
      }));
    }
    return chant.segments
      .filter((s) => s.kind !== "silence")
      .map((s) => ({ startSec: null, text: s.text, kind: s.kind }));
  }, [chant]);

  const activeIndex = useMemo(() => {
    if (!active) return -1;
    let found = -1;
    for (let i = 0; i < lines.length; i++) {
      const start = lines[i].startSec;
      if (start == null) return -1;
      if (time + 0.05 >= start) found = i;
      else break;
    }
    return found;
  }, [active, lines, time]);

  // Keep the spoken line in view, but only while this chant is the one playing.
  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current
      ?.querySelector(`[data-line="${activeIndex}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex]);

  if (lines.length === 0) return null;

  const synced = chant.timings.length > 0;

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="type-feature text-ink">บทสวดและคำแปล</h2>
        {synced && (
          <p className="type-small text-muted">แตะที่บรรทัดเพื่อข้ามไปฟัง</p>
        )}
      </div>

      <ol ref={listRef} className="mt-4 max-w-[68ch] space-y-1">
        {lines.map((line, i) => {
          const isActive = i === activeIndex;
          const pali = line.kind === "pali";
          return (
            <li key={i} data-line={i}>
              <button
                type="button"
                disabled={!synced}
                onClick={() => {
                  if (line.startSec == null) return;
                  if (active) seek(line.startSec);
                  else {
                    play(chant);
                    // The element needs a source before a seek will stick.
                    setTimeout(() => seek(line.startSec!), 120);
                  }
                }}
                className={`w-full rounded-md px-3 py-1 text-left transition-colors duration-300 ${
                  pali ? "type-pali" : "type-caption"
                } ${
                  isActive
                    ? "bg-white/[0.06] text-ink"
                    : synced && active
                      ? "text-muted opacity-45"
                      : pali
                        ? "text-near-white"
                        : "text-muted"
                } ${synced ? "cursor-pointer hover:text-ink" : "cursor-default"}`}
              >
                {line.text}
              </button>
            </li>
          );
        })}
      </ol>

      {!synced && chant.audioUrl && (
        <p className="mt-4 type-small text-muted">
          ตอนนี้ยังไม่มีจังหวะไฮไลต์ตามเสียงสำหรับบทนี้ — ข้อความด้านบนใช้อ่านตามได้
        </p>
      )}
    </section>
  );
}
