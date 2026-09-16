"use client";

import Link from "next/link";
import { formatTime } from "@/lib/format";
import { Cover } from "../Cover";
import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  ChevronDownIcon,
} from "../Icons";
import { usePlayer } from "./PlayerProvider";
import { RatePicker } from "./RatePicker";
import { RoundsPicker } from "./RoundsPicker";
import { Scrubber } from "./Scrubber";

/**
 * The now-playing bar — persistent at every breakpoint, per DESIGN.md.
 *
 * On mobile it collapses to art, title and one control, and tapping it opens
 * the full-screen player. On desktop the transport moves to the centre and the
 * scrubber appears beneath it.
 */
export function PlayerBar() {
  const { current, playing, toggle, next, prev, time, duration, seek, setExpanded } =
    usePlayer();

  if (!current) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(57px+env(safe-area-inset-bottom))] z-30 px-2 lg:bottom-0 lg:px-0">
      <div
        className="flex items-center gap-3 rounded-lg bg-card px-3 py-2 shadow-[var(--shadow-dialog)]
          lg:rounded-none lg:border-t lg:border-white/5 lg:bg-base lg:px-4 lg:py-3 lg:shadow-none"
      >
        {/* Left: what is playing */}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left lg:flex-none lg:w-[30%]"
        >
          <Cover
            src={current.cover}
            alt={current.title}
            sizes="56px"
            className="w-11 shrink-0 lg:w-14"
          />
          <span className="min-w-0">
            <span className="block truncate type-caption-bold text-ink">
              {current.title}
            </span>
            <span className="block truncate type-small text-muted">
              เสียงสวด Podcast
            </span>
          </span>
          <ChevronDownIcon size={18} className="shrink-0 rotate-180 text-muted lg:hidden" />
        </button>

        {/* Centre: transport */}
        <div className="flex shrink-0 items-center gap-2 lg:flex-1 lg:flex-col lg:gap-1">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={prev}
              aria-label="ตอนก่อนหน้า"
              className="hidden text-muted transition-colors hover:text-ink lg:block"
            >
              <PrevIcon size={20} />
            </button>
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "หยุดชั่วคราว" : "เล่น"}
              className="grid size-9 place-items-center rounded-full bg-ink text-base transition-transform duration-150 hover:scale-105 active:scale-95 lg:size-8"
            >
              {playing ? (
                <PauseIcon size={16} />
              ) : (
                <PlayIcon size={16} className="translate-x-[1px]" />
              )}
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="ตอนถัดไป"
              className="hidden text-muted transition-colors hover:text-ink lg:block"
            >
              <NextIcon size={20} />
            </button>
          </div>

          <div className="hidden w-full max-w-[520px] items-center gap-2 lg:flex">
            <span className="type-micro tabular-nums text-muted">{formatTime(time)}</span>
            <Scrubber time={time} duration={duration} onSeek={seek} showTimes={false} />
            <span className="type-micro tabular-nums text-muted">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: speed, and the chant page where the full text lives */}
        <div className="hidden w-[30%] items-center justify-end gap-2 lg:flex">
          <RoundsPicker compact />
          <RatePicker />
          <Link
            href={`/chant/${current.slug}`}
            className="rounded-full px-3 py-1.5 type-small-bold text-muted transition-colors hover:bg-mid hover:text-ink"
          >
            เปิดบทสวด
          </Link>
        </div>
      </div>

      {/* Mobile keeps a hairline of progress rather than a full scrubber. */}
      <div className="mx-3 h-[2px] rounded-full bg-white/15 lg:hidden">
        <div
          className="h-full rounded-full bg-ink transition-[width] duration-300"
          style={{ width: `${duration ? (time / duration) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}
