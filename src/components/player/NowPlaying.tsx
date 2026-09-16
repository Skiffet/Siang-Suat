"use client";

import Link from "next/link";
import { useState } from "react";
import { Cover } from "../Cover";
import {
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  MoreIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  PrevIcon,
  RepeatIcon,
  ShareIcon,
  ShuffleIcon,
} from "../Icons";
import { usePlayer } from "./PlayerProvider";
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
  } = usePlayer();

  const [sleepOpen, setSleepOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!current || !expanded) return null;

  return (
    <div className="animate-rise fixed inset-0 z-50 overflow-y-auto bg-base">
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

      <div className="relative mx-auto flex min-h-full w-full max-w-[420px] flex-col px-5 pb-10 pt-[calc(12px+env(safe-area-inset-top))]">
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
          <button
            type="button"
            aria-label="ตัวเลือกเพิ่มเติม"
            className="grid size-9 place-items-center rounded-full text-ink transition-colors hover:bg-white/10"
          >
            <MoreIcon size={20} />
          </button>
        </header>

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

        <div className="mt-7 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="type-section text-ink">{current.title}</h1>
            <p className="mt-1 type-caption text-muted">เสียงสวด Podcast</p>
          </div>
          <button
            type="button"
            onClick={() => setSaved((s) => !s)}
            aria-label={saved ? "เอาออกจากรายการโปรด" : "บันทึกลงรายการโปรด"}
            aria-pressed={saved}
            className={`mt-1 grid size-8 shrink-0 place-items-center rounded-full transition-colors ${
              saved
                ? "bg-green text-on-green"
                : "border border-line-light text-muted hover:text-ink"
            }`}
          >
            {saved ? <CheckIcon size={16} /> : <PlusIcon size={16} />}
          </button>
        </div>

        <Scrubber time={time} duration={duration} onSeek={seek} className="mt-6" />

        <div className="mt-4 flex items-center justify-between">
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
              repeat === "one" ? "เล่นซ้ำตอนนี้" : repeat === "all" ? "เล่นซ้ำทั้งหมด" : "ไม่เล่นซ้ำ"
            }
            className={`relative grid size-10 place-items-center rounded-full transition-colors ${
              repeat === "off" ? "text-muted hover:text-ink" : "text-green"
            }`}
          >
            <RepeatIcon size={20} />
            {repeat === "one" && (
              <span className="absolute -bottom-0.5 type-micro font-bold">1</span>
            )}
          </button>
        </div>

        {/* Sleep timer, save, share — the three things people reach for at night. */}
        <div className="mt-7 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setSleepOpen((o) => !o)}
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 type-small-bold transition-colors ${
              sleepLeftSec != null
                ? "bg-green text-on-green"
                : "bg-mid text-ink hover:bg-card"
            }`}
          >
            <ClockIcon size={16} />
            {sleepLeftSec != null
              ? `${Math.ceil(sleepLeftSec / 60)} นาที`
              : "ตั้งเวลา"}
          </button>
          <button
            type="button"
            onClick={() => setSaved((s) => !s)}
            className="flex items-center gap-2 rounded-full bg-mid px-4 py-2.5 type-small-bold text-ink transition-colors hover:bg-card"
          >
            {saved ? <CheckIcon size={16} /> : <PlusIcon size={16} />}
            {saved ? "บันทึกแล้ว" : "บันทึก"}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-mid px-4 py-2.5 type-small-bold text-ink transition-colors hover:bg-card"
          >
            <ShareIcon size={16} />
            แชร์
          </button>
        </div>

        {sleepOpen && (
          <div className="animate-fade-in mt-3 rounded-xl bg-card p-3 shadow-[var(--shadow-dialog)]">
            <p className="px-1 pb-2 type-small text-muted">
              หยุดเล่นอัตโนมัติหลังจาก
            </p>
            <div className="flex flex-wrap gap-2">
              {SLEEP_OPTIONS.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => {
                    startSleepTimer(min);
                    setSleepOpen(false);
                  }}
                  className="rounded-full bg-mid px-3.5 py-2 type-small-bold text-ink transition-colors hover:bg-base"
                >
                  {min} นาที
                </button>
              ))}
              {sleepLeftSec != null && (
                <button
                  type="button"
                  onClick={() => {
                    startSleepTimer(null);
                    setSleepOpen(false);
                  }}
                  className="rounded-full border border-line-light px-3.5 py-2 type-small-bold text-muted transition-colors hover:text-ink"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </div>
        )}

        {upNext && (
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

        <Link
          href={`/chant/${current.slug}`}
          onClick={() => setExpanded(false)}
          className="mt-5 block rounded-xl border border-line py-3 text-center type-small-bold text-muted transition-colors hover:border-line-light hover:text-ink"
        >
          อ่านบทสวดพร้อมคำแปล
        </Link>
      </div>
    </div>
  );
}
