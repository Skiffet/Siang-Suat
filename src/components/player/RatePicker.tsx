"use client";

import { useEffect, useRef, useState } from "react";
import { SpeedIcon } from "../Icons";
import { usePlayer } from "./PlayerProvider";

/**
 * Chanting speed. The range is narrower and stepped more finely than a
 * podcast app's, because this is for matching a pace you already keep rather
 * than for getting through the material faster — past 1.5x the words stop
 * being chantable.
 */
export const RATE_OPTIONS = [0.75, 0.85, 1, 1.15, 1.25, 1.5];

/**
 * The speed control as it appears in the now-playing bar: a compact button
 * that opens the options above itself. The full-screen player lays the same
 * options out inline instead, where there is room for them.
 */
export function RatePicker() {
  const { rate, setRate } = usePlayer();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // A popover in the player bar has to close on an outside click, or it sits
  // over the page until something else happens to be clicked.
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="ความเร็วในการสวด"
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 type-small-bold transition-colors ${
          rate !== 1 ? "bg-green text-on-green" : "text-muted hover:bg-mid hover:text-ink"
        }`}
      >
        <SpeedIcon size={16} />
        {rate}x
      </button>

      {open && (
        <div className="animate-fade-in absolute bottom-full right-0 mb-2 w-max rounded-xl bg-card p-3 shadow-[var(--shadow-dialog)]">
          <p className="px-1 pb-2 type-small text-muted">
            ความเร็วในการสวด — เสียงยังคงระดับเดิม
          </p>
          <div className="flex gap-2">
            {RATE_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRate(r);
                  setOpen(false);
                }}
                aria-pressed={rate === r}
                className={`rounded-full px-3 py-1.5 type-small-bold transition-colors ${
                  rate === r ? "bg-green text-on-green" : "bg-mid text-ink hover:bg-base"
                }`}
              >
                {r === 1 ? "ปกติ" : `${r}x`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
