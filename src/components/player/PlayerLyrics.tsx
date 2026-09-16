"use client";

import { useEffect, useRef } from "react";
import type { ChantWithAudio } from "@/lib/types";
import { useLyrics } from "../useLyrics";

/**
 * Follow-along text inside the player — the chant-along view.
 *
 * On a phone this is where the text has to live: the full-screen player is
 * what is on screen while you are actually chanting, and walking back out to
 * the chant page to read would mean losing the controls. The type runs large
 * because the phone is usually on a table or a cushion, not in your hand.
 *
 * The list scrolls itself rather than the page, so the controls below stay put
 * while the lines move.
 */
export function PlayerLyrics({ chant }: { chant: ChantWithAudio }) {
  const { lines, activeIndex, synced, goTo } = useLyrics(chant);
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the spoken line centred in the scroller, not in the page.
  useEffect(() => {
    if (activeIndex < 0) return;
    const list = listRef.current;
    const line = list?.querySelector<HTMLElement>(`[data-line="${activeIndex}"]`);
    if (!list || !line) return;
    // Measured against the scroller itself rather than via offsetTop, which is
    // relative to the nearest positioned ancestor and lands in the wrong place
    // once the list carries padding.
    const listBox = list.getBoundingClientRect();
    const lineBox = line.getBoundingClientRect();
    const offset =
      lineBox.top - listBox.top - list.clientHeight / 2 + lineBox.height / 2;
    list.scrollTo({ top: list.scrollTop + offset, behavior: "smooth" });
  }, [activeIndex]);

  if (lines.length === 0) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/*
        The fade at both edges stands in for a hard crop — a line leaving the
        view dissolves instead of being sliced through the middle of its
        vowels. The tall padding lets the first and last lines reach the
        centre, so the active line sits in the same place all the way through.
      */}
      <div
        ref={listRef}
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto py-[28%]"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
        }}
      >
        {lines.map((line, i) => {
          const isActive = i === activeIndex;
          const pali = line.kind === "pali";
          const cue = line.kind === "cue";
          return (
            <button
              key={i}
              data-line={i}
              type="button"
              disabled={!synced}
              onClick={() => goTo(line)}
              className={`block w-full rounded-lg px-3 py-2 transition-all duration-300 ${
                cue
                  ? "text-center text-[13px] font-semibold uppercase tracking-[2px]"
                  : pali
                    ? "text-left font-serif text-[22px] leading-[42px]"
                    : "text-left text-[16px] leading-[30px]"
              } ${
                isActive
                  ? "text-ink"
                  : synced
                    ? "text-muted opacity-40"
                    : pali
                      ? "text-near-white"
                      : "text-muted"
              } ${synced ? "cursor-pointer" : "cursor-default"}`}
            >
              {line.text}
            </button>
          );
        })}
      </div>

      {!synced && (
        <p className="shrink-0 px-3 pb-2 type-small text-muted">
          บทนี้ยังไม่มีจังหวะไฮไลต์ตามเสียง — ใช้อ่านตามได้
        </p>
      )}
    </div>
  );
}
