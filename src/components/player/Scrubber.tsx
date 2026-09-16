"use client";

import { formatTime } from "@/lib/format";

/**
 * The progress bar.
 *
 * A range input underneath an invisible track gives real dragging and keyboard
 * support for free; the visible fill is painted with a gradient on the input
 * itself. The fill turns green on hover, matching the now-playing scrubber.
 */
export function Scrubber({
  time,
  duration,
  onSeek,
  showTimes = true,
  className = "",
}: {
  time: number;
  duration: number;
  onSeek: (seconds: number) => void;
  showTimes?: boolean;
  className?: string;
}) {
  const pct = duration > 0 ? Math.min(100, (time / duration) * 100) : 0;

  return (
    <div className={`group/scrub w-full ${className}`}>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(time, duration || 0)}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="ตำแหน่งการเล่น"
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-transparent outline-none
          [background-image:linear-gradient(var(--fill),var(--fill))] [background-repeat:no-repeat]
          [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full
          [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink
          [&::-webkit-slider-thumb]:opacity-0 [&::-webkit-slider-thumb]:-mt-1
          group-hover/scrub:[&::-webkit-slider-thumb]:opacity-100
          [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-ink"
        style={
          {
            "--fill": "var(--text-base)",
            backgroundColor: "rgba(255,255,255,0.28)",
            backgroundSize: `${pct}% 100%`,
          } as React.CSSProperties
        }
      />
      {showTimes && (
        <div className="mt-2 flex justify-between type-micro tabular-nums text-muted">
          <span>{formatTime(time)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}
