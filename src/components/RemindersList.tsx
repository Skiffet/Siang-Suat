"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  deleteReminder,
  getRemindersServerSnapshot,
  getRemindersSnapshot,
  saveReminder,
  subscribeReminders,
} from "@/lib/reminder";
import { Cover } from "./Cover";
import { PlusIcon } from "./Icons";

/** "curated:morning" / "mine:<id>" back to the page that reminder belongs to. */
function hrefFor(key: string): string {
  const [kind, ...rest] = key.split(":");
  const id = rest.join(":");
  return kind === "mine" ? `/playlist/mine?id=${id}` : `/playlist/${id}`;
}

/**
 * Every reminder currently set, in one place — each playlist keeps its own
 * on/off and time, so this is where they are all visible together rather
 * than only discoverable one playlist page at a time.
 */
export function RemindersList() {
  const reminders = useSyncExternalStore(
    subscribeReminders,
    getRemindersSnapshot,
    getRemindersServerSnapshot,
  );

  if (reminders.length === 0) {
    return (
      <section className="mt-8">
        <h2 className="type-feature text-ink">การแจ้งเตือน</h2>
        <p className="mt-2 type-caption text-muted">
          ยังไม่ได้ตั้งเตือนบทไหนไว้ — เปิดได้จากหน้าเพลย์ลิสต์แต่ละอัน
          (ไอคอนกระดิ่งข้างปุ่มเล่น)
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="type-feature text-ink">การแจ้งเตือน</h2>
      <ul className="mt-3 space-y-1">
        {reminders.map((reminder) => (
          <li
            key={reminder.key}
            className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-card-alt"
          >
            <Link href={hrefFor(reminder.key)} className="flex min-w-0 flex-1 items-center gap-3">
              <Cover src={reminder.cover} alt={reminder.title} sizes="44px" className="w-11 shrink-0" />
              <span className="min-w-0">
                <span className="block truncate type-caption-bold text-ink">
                  {reminder.title}
                </span>
                <span className="block truncate type-small text-muted">
                  เตือนเวลา {reminder.time} น.
                </span>
              </span>
            </Link>

            <input
              type="time"
              value={reminder.time}
              onChange={(e) => saveReminder({ ...reminder, time: e.target.value })}
              aria-label={`เวลาแจ้งเตือนของ ${reminder.title}`}
              className="input-inset shrink-0 rounded-lg bg-mid px-2 py-1.5 type-small text-ink outline-none transition-shadow [color-scheme:dark]"
            />
            <button
              type="button"
              onClick={() => deleteReminder(reminder.key)}
              aria-label={`ปิดการแจ้งเตือนของ ${reminder.title}`}
              className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-ink"
            >
              <PlusIcon size={16} className="rotate-45" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
