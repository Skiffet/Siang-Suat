"use client";

import { useEffect, useRef, useState } from "react";
import { RepeatIcon } from "../Icons";
import { usePlayer } from "./PlayerProvider";

/**
 * How many times through the chant.
 *
 * Counts a recital is actually kept in: three, five, seven, nine, and the
 * hundred and eight of a mala. This is not the same as looping — a sitting
 * has a number, and it ends when the number is reached, which is why the
 * repeat button could not stand in for it.
 *
 * `chant.repeat` in the content is a different thing: how many times the
 * recording itself says the words. This is how many times you want to hear
 * that recording.
 */
export const ROUND_OPTIONS = [1, 3, 5, 7, 9, 108];

export function RoundsPicker({ compact = false }: { compact?: boolean }) {
  const { rounds, round, setRounds, current } = usePlayer();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const counting = rounds > 1 && current != null;
  const label = counting ? `${round}/${rounds} จบ` : rounds > 1 ? `${rounds} จบ` : "จบเดียว";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="จำนวนจบที่จะสวด"
        aria-expanded={open}
        className={
          compact
            ? `flex items-center gap-1.5 rounded-full px-3 py-1.5 type-small-bold transition-colors ${
                rounds > 1
                  ? "bg-green text-on-green"
                  : "text-muted hover:bg-mid hover:text-ink"
              }`
            : `flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 type-small-bold transition-colors ${
                rounds > 1 ? "bg-green text-on-green" : "bg-mid text-ink hover:bg-card"
              }`
        }
      >
        <RepeatIcon size={16} />
        {label}
      </button>

      {open && (
        <div
          className={`animate-fade-in absolute bottom-full mb-2 w-max rounded-xl bg-card p-3 shadow-[var(--shadow-dialog)] ${
            compact ? "right-0" : "left-1/2 -translate-x-1/2"
          }`}
        >
          <p className="px-1 pb-2 type-small text-muted">
            สวดกี่จบ — เล่นซ้ำจนครบแล้วไปตอนถัดไป
          </p>
          <div className="flex gap-2">
            {ROUND_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setRounds(n);
                  setOpen(false);
                }}
                aria-pressed={rounds === n}
                className={`rounded-full px-3 py-1.5 type-small-bold transition-colors ${
                  rounds === n ? "bg-green text-on-green" : "bg-mid text-ink hover:bg-base"
                }`}
              >
                {n === 1 ? "จบเดียว" : `${n} จบ`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
