"use client";

import type { ChantWithAudio } from "@/lib/types";
import { TrackRow } from "./TrackRow";
import { ClockIcon } from "./Icons";
import { usePlayer } from "./player/PlayerProvider";

const PRESETS = [5, 10, 15, 30, 45, 60];

/**
 * The listening screen: a sleep timer and a weekly summary.
 *
 * The streak numbers are illustrative for the demo — nothing is recorded yet,
 * so they are written here rather than read from storage.
 */
export function TimerView({ chants }: { chants: ChantWithAudio[] }) {
  const { sleepLeftSec, startSleepTimer, current } = usePlayer();

  const mins = sleepLeftSec == null ? null : Math.floor(sleepLeftSec / 60);
  const secs = sleepLeftSec == null ? null : sleepLeftSec % 60;

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      <h1 className="type-section text-ink">เวลาฟัง</h1>
      <p className="mt-1 type-caption text-muted">
        ตั้งเวลาให้เสียงค่อย ๆ เบาลงแล้วหยุดเอง เหมาะกับการฟังจนหลับ
      </p>

      <section className="mt-6 rounded-xl bg-surface p-6 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-mid text-green">
          <ClockIcon size={24} />
        </span>
        <p className="mt-4 type-section tabular-nums text-ink">
          {sleepLeftSec == null
            ? "ยังไม่ได้ตั้งเวลา"
            : `${mins}:${String(secs).padStart(2, "0")}`}
        </p>
        <p className="mt-1 type-small text-muted">
          {sleepLeftSec == null
            ? current
              ? `กำลังฟัง “${current.title}”`
              : "เลือกบทสวดแล้วกลับมาตั้งเวลาได้เลย"
            : "เสียงจะค่อย ๆ เบาลงใน 10 วินาทีสุดท้าย"}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {PRESETS.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => startSleepTimer(min)}
              className="rounded-full bg-mid px-4 py-2.5 type-small-bold text-ink transition-colors hover:bg-card"
            >
              {min} นาที
            </button>
          ))}
          {sleepLeftSec != null && (
            <button
              type="button"
              onClick={() => startSleepTimer(null)}
              className="rounded-full border border-line-light px-4 py-2.5 type-small-bold text-muted transition-colors hover:text-ink"
            >
              ยกเลิก
            </button>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="type-feature text-ink">สัปดาห์นี้</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: "เวลาฟังรวม", value: "2 ชม. 14 นาที" },
            { label: "สวดต่อเนื่อง", value: "5 วัน" },
            { label: "บทที่ฟังบ่อย", value: "ก่อนนอน" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-surface p-4">
              <p className="type-small text-muted">{stat.label}</p>
              <p className="mt-1 type-caption-bold text-ink">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="type-feature text-ink">ฟังต่อจากที่ค้างไว้</h2>
        <div className="mt-3 space-y-0.5">
          {chants.map((chant, i) => (
            <TrackRow key={chant.slug} chant={chant} queue={chants} position={i + 1} />
          ))}
        </div>
      </section>
    </div>
  );
}
