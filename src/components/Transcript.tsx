"use client";

import { useEffect, useRef } from "react";
import type { ChantWithAudio } from "@/lib/types";
import { useLyrics } from "./useLyrics";

/**
 * The chant text, read along with the audio.
 *
 * When the pipeline reported line timings, the line being spoken lifts to full
 * white and the rest dim back — and clicking any line seeks to it. Takes made
 * outside the pipeline have no timings, so the same text renders as a plain
 * reading panel rather than pretending to be in sync.
 */
export function Transcript({ chant }: { chant: ChantWithAudio }) {
  const { lines, activeIndex, synced, goTo } = useLyrics(chant);
  const listRef = useRef<HTMLOListElement>(null);

  // Keep the spoken line in view, but only while this chant is the one playing.
  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current
      ?.querySelector(`[data-line="${activeIndex}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex]);

  if (lines.length === 0) return null;

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
          const cue = line.kind === "cue";
          return (
            <li key={i} data-line={i}>
              <button
                type="button"
                disabled={!synced}
                onClick={() => goTo(line)}
                className={`w-full rounded-md px-3 py-1 transition-colors duration-300 ${
                  cue
                    ? "text-center text-[12px] font-semibold uppercase tracking-[2px]"
                    : pali
                      ? "text-left type-pali"
                      : "text-left type-caption"
                } ${
                  isActive
                    ? "bg-white/[0.06] text-ink"
                    : synced
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
