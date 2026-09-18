"use client";

import Link from "next/link";
import { useState } from "react";
import { Cover } from "../Cover";
import {
  ChevronDownIcon,
  MoreIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  SettingsIcon,
  ShuffleIcon,
  TextIcon,
} from "../Icons";
import { loadTextSize, saveTextSize, TEXT_SIZE_LABELS, TEXT_SIZE_STEPS } from "@/lib/textSize";
import { PlayerLyrics } from "./PlayerLyrics";
import { usePlayer } from "./PlayerProvider";
import { RATE_OPTIONS } from "./RatePicker";
import { ROUND_OPTIONS } from "./RoundsPicker";
import { Scrubber } from "./Scrubber";

const SLEEP_OPTIONS = [5, 10, 15, 30, 45, 60];

/**
 * The full-screen player.
 *
 * It covers the app rather than routing, so playback and scroll position
 * survive opening and closing it. The cover art's own colour is pulled up
 * behind the controls as a soft wash — the only gradient in the interface, and
 * it comes from the content rather than from the palette.
 */
export function NowPlaying() {
  const {
    current,
    expanded,
    setExpanded,
    playing,
    toggle,
    next,
    prev,
    time,
    duration,
    seek,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    upNext,
    sleepLeftSec,
    startSleepTimer,
    rate,
    setRate,
    rounds,
    round,
    roundsActive,
    setRounds,
  } = usePlayer();

  const [roundsOpen, setRoundsOpen] = useState(false);
  // Speed, sleep timer and text size are all "set once and forget" —
  // grouped behind one gear so the row of pills doesn't itself need
  // scrolling to reach the things people actually touch every listen.
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** Swaps the art for the chant text, so reading along keeps the controls. */
  const [reading, setReading] = useState(true);
  // Read once from storage at mount. This component is always in the tree
  // client-side (it just renders nothing until `expanded`), so there is no
  // SSR value to mismatch against, and no later remount to re-read on.
  const [textScale, setTextScaleState] = useState(loadTextSize);
  function setTextScale(scale: number) {
    setTextScaleState(scale);
    saveTextSize(scale);
  }

  if (!current || !expanded) return null;

  return (
    <div
      className={`animate-rise fixed inset-0 z-50 bg-base ${
        reading ? "overflow-hidden" : "overflow-y-auto"
      }`}
    >
      {/* The wash that lifts the art's colour behind the controls. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] opacity-40 blur-3xl"
        style={{
          backgroundImage: `url(/covers/${current.cover}.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          maskImage: "linear-gradient(to bottom, black, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      />

      <div
        className={`relative mx-auto flex w-full max-w-[420px] flex-col px-5 pb-10 pt-[calc(12px+env(safe-area-inset-top))] ${
          reading ? "h-full" : "min-h-full"
        }`}
      >
        <header className="flex items-center justify-between py-2">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="ย่อเครื่องเล่น"
            className="grid size-9 place-items-center rounded-full text-ink transition-colors hover:bg-white/10"
          >
            <ChevronDownIcon size={22} />
          </button>
          <div className="text-center">
            <p className="type-micro uppercase tracking-[1.4px] text-muted">
              กำลังเล่นจาก
            </p>
            <p className="type-small-bold text-ink">
              {current.subtitle ?? "เสียงสวด Podcast"}
            </p>
          </div>
          {/* Balances the collapse button, so the title stays centred. */}
          <span className="size-9" />
        </header>

        {reading ? (
          <>
            <div className="mb-1 mt-5 flex shrink-0 items-center gap-3 border-b border-white/5 pb-4">
              <Cover
                src={current.cover}
                alt={current.title}
                sizes="56px"
                className="w-14 shrink-0"
              />
              <div className="min-w-0">
                <h1 className="truncate type-caption-bold text-ink">
                  {current.title}
                </h1>
                <p className="truncate type-small text-muted">
                  เสียงสวด Podcast
                </p>
              </div>
            </div>
            <PlayerLyrics chant={current} textScale={textScale} />
          </>
        ) : (
          <div className="mt-6">
            <Cover
              src={current.cover}
              alt={current.title}
              sizes="(min-width: 420px) 380px, 90vw"
              rounded="rounded-lg"
              preload
              className="shadow-[var(--shadow-dialog)]"
            />
          </div>
        )}

        <div
          className={`flex items-start justify-between gap-4 ${reading ? "hidden" : "mt-7"}`}
        >
          <div className="min-w-0">
            <h1 className="type-section text-ink">{current.title}</h1>
            <p className="mt-1 type-caption text-muted">เสียงสวด Podcast</p>
          </div>
        </div>

        <Scrubber
          time={time}
          duration={duration}
          onSeek={seek}
          className={reading ? "mt-2 shrink-0" : "mt-6"}
        />

        <div className="mt-4 flex shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label="สุ่มลำดับ"
            aria-pressed={shuffle}
            className={`grid size-10 place-items-center rounded-full transition-colors ${
              shuffle ? "text-green" : "text-muted hover:text-ink"
            }`}
          >
            <ShuffleIcon size={20} />
          </button>

          <button
            type="button"
            onClick={prev}
            aria-label="ตอนก่อนหน้า"
            className="grid size-11 place-items-center text-ink transition-transform active:scale-90"
          >
            <PrevIcon size={28} />
          </button>

          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "หยุดชั่วคราว" : "เล่น"}
            className="grid size-16 place-items-center rounded-full bg-green text-on-green transition-transform duration-150 hover:scale-105 active:scale-95"
          >
            {playing ? (
              <PauseIcon size={26} />
            ) : (
              <PlayIcon size={26} className="translate-x-[2px]" />
            )}
          </button>

          <button
            type="button"
            onClick={next}
            aria-label="ตอนถัดไป"
            className="grid size-11 place-items-center text-ink transition-transform active:scale-90"
          >
            <NextIcon size={28} />
          </button>

          <button
            type="button"
            onClick={cycleRepeat}
            aria-label={
              repeat === "one"
                ? "เล่นซ้ำตอนนี้"
                : repeat === "all"
                  ? "เล่นซ้ำทั้งหมด"
                  : "ไม่เล่นซ้ำ"
            }
            className={`relative grid size-10 place-items-center rounded-full transition-colors ${
              repeat === "off" ? "text-muted hover:text-ink" : "text-green"
            }`}
          >
            <RepeatIcon size={20} />
            {repeat === "one" && (
              <span className="absolute -bottom-0.5 type-micro font-bold">
                1
              </span>
            )}
          </button>
        </div>

        {/* Reading and rounds — what changes every listen. Speed, sleep and
            text size are set-once preferences, tucked behind the gear so
            this row stays put rather than needing a scroll to see it all. */}
        <div
          className={`no-scrollbar -mx-5 shrink-0 overflow-x-auto px-5 ${reading ? "mt-4" : "mt-7"}`}
        >
          <div className="mx-auto flex w-max items-center gap-2">
            <button
              type="button"
              onClick={() => setReading((r) => !r)}
              aria-pressed={reading}
              className={`flex items-center gap-2 shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 type-small-bold transition-colors ${
                reading
                  ? "bg-green text-on-green"
                  : "bg-mid text-ink hover:bg-card"
              }`}
            >
              <TextIcon size={16} />
              บทสวด
            </button>
            <button
              type="button"
              onClick={() => {
                setRoundsOpen((o) => !o);
                setSettingsOpen(false);
              }}
              aria-pressed={rounds > 1}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 type-small-bold transition-colors ${
                rounds > 1
                  ? "bg-green text-on-green"
                  : "bg-mid text-ink hover:bg-card"
              }`}
            >
              <RepeatIcon size={16} />
              {rounds <= 1
                ? "จบเดียว"
                : roundsActive
                  ? `${round}/${rounds} จบ`
                  : `${rounds} จบ`}
            </button>
            <button
              type="button"
              onClick={() => {
                setSettingsOpen((o) => !o);
                setRoundsOpen(false);
              }}
              aria-expanded={settingsOpen}
              aria-label="ตั้งค่าเพิ่มเติม"
              className={`relative grid size-10 shrink-0 place-items-center rounded-full transition-colors ${
                settingsOpen
                  ? "bg-green text-on-green"
                  : "bg-mid text-ink hover:bg-card"
              }`}
            >
              <SettingsIcon size={18} />
              {!settingsOpen &&
                (rate !== 1 || sleepLeftSec != null || (reading && textScale !== 1)) && (
                  <span className="absolute right-0.5 top-0.5 size-2 rounded-full bg-green" />
                )}
            </button>
          </div>
        </div>

        {roundsOpen && (
          <div className="animate-fade-in mt-3 shrink-0 rounded-xl bg-card p-3 shadow-[var(--shadow-dialog)]">
            <p className="px-1 pb-2 type-small text-muted">
              สวดกี่จบ — เล่นซ้ำจนครบแล้วไปตอนถัดไป
            </p>
            <div className="flex flex-wrap gap-2">
              {ROUND_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setRounds(n);
                    setRoundsOpen(false);
                  }}
                  aria-pressed={rounds === n}
                  className={`rounded-full px-3.5 py-2 type-small-bold transition-colors ${
                    rounds === n
                      ? "bg-green text-on-green"
                      : "bg-mid text-ink hover:bg-base"
                  }`}
                >
                  {n === 1 ? "จบเดียว" : `${n} จบ`}
                </button>
              ))}
            </div>
          </div>
        )}

        {settingsOpen && (
          <div className="animate-fade-in mt-3 shrink-0 space-y-4 rounded-xl bg-card p-3 shadow-[var(--shadow-dialog)]">
            {reading && (
              <div>
                <p className="px-1 pb-2 type-small text-muted">ขนาดตัวอักษรบทสวด</p>
                <div className="flex flex-wrap gap-2">
                  {TEXT_SIZE_STEPS.map((scale, i) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => setTextScale(scale)}
                      aria-pressed={textScale === scale}
                      style={{ fontSize: `${13 * scale}px` }}
                      className={`rounded-full px-3.5 py-2 font-bold transition-colors ${
                        textScale === scale
                          ? "bg-green text-on-green"
                          : "bg-mid text-ink hover:bg-base"
                      }`}
                    >
                      {TEXT_SIZE_LABELS[i]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="px-1 pb-2 type-small text-muted">
                ความเร็วในการสวด — เสียงยังคงระดับเดิม ไม่แหลมขึ้น
              </p>
              <div className="flex flex-wrap gap-2">
                {RATE_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRate(r)}
                    aria-pressed={rate === r}
                    className={`rounded-full px-3.5 py-2 type-small-bold transition-colors ${
                      rate === r
                        ? "bg-green text-on-green"
                        : "bg-mid text-ink hover:bg-base"
                    }`}
                  >
                    {r === 1 ? "ปกติ" : `${r}x`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="px-1 pb-2 type-small text-muted">
                หยุดเล่นอัตโนมัติหลังจาก
              </p>
              <div className="flex flex-wrap gap-2">
                {SLEEP_OPTIONS.map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => startSleepTimer(min)}
                    aria-pressed={
                      sleepLeftSec != null && Math.ceil(sleepLeftSec / 60) === min
                    }
                    className={`rounded-full px-3.5 py-2 type-small-bold transition-colors ${
                      sleepLeftSec != null && Math.ceil(sleepLeftSec / 60) === min
                        ? "bg-green text-on-green"
                        : "bg-mid text-ink hover:bg-base"
                    }`}
                  >
                    {min} นาที
                  </button>
                ))}
                {sleepLeftSec != null && (
                  <button
                    type="button"
                    onClick={() => startSleepTimer(null)}
                    className="rounded-full border border-line-light px-3.5 py-2 type-small-bold text-muted transition-colors hover:text-ink"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {upNext && !reading && (
          <div className="mt-7 rounded-xl bg-surface p-4">
            <p className="type-small-bold text-muted">กำลังเล่นถัดไป</p>
            <Link
              href={`/chant/${upNext.slug}`}
              onClick={() => setExpanded(false)}
              className="mt-3 flex items-center gap-3"
            >
              <Cover
                src={upNext.cover}
                alt={upNext.title}
                sizes="48px"
                className="w-12 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate type-caption-bold text-ink">
                  {upNext.title}
                </span>
                <span className="block truncate type-small text-muted">
                  เสียงสวด Podcast
                </span>
              </span>
              <MoreIcon size={18} className="shrink-0 text-muted" />
            </Link>
          </div>
        )}

        {!reading && (
          <Link
            href={`/chant/${current.slug}`}
            onClick={() => setExpanded(false)}
            className="mt-5 block rounded-xl border border-line py-3 text-center type-small-bold text-muted transition-colors hover:border-line-light hover:text-ink"
          >
            เปิดหน้าบทสวดเต็ม
          </Link>
        )}
      </div>
    </div>
  );
}
