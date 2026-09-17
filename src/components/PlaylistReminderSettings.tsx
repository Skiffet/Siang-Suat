"use client";

import { useState, useSyncExternalStore } from "react";
import {
  deleteReminder,
  getNotificationPermission,
  getReminder,
  requestNotificationPermission,
  saveReminder,
  subscribeReminders,
  type PermissionState,
} from "@/lib/reminder";
import { BellIcon, CheckIcon } from "./Icons";

const neverChanges = () => () => {};
const DEFAULT_TIME = "20:00";

/**
 * One playlist's own reminder — "remind me about this one at this time",
 * separate from whatever time every other playlist is set to. Reusable
 * wherever a specific playlist needs its own on/off and time, rather than a
 * single app-wide alarm.
 *
 * This is not a push notification: nothing here has a server, so it only
 * fires while some tab of this site is open somewhere. Said plainly in the
 * UI rather than left to be discovered the day it silently doesn't fire.
 */
export function PlaylistReminderSettings({
  playlistKey,
  title,
  cover,
  compact = false,
}: {
  playlistKey: string;
  title: string;
  cover: string;
  compact?: boolean;
}) {
  const reminder = useSyncExternalStore(
    subscribeReminders,
    () => getReminder(playlistKey),
    () => undefined,
  );
  // Browsers give no change event for Notification.permission, so there is
  // nothing real to subscribe to — read fresh on every render instead (via
  // the no-op subscribe below).
  const permission = useSyncExternalStore(
    neverChanges,
    getNotificationPermission,
    (): PermissionState => "default",
  );
  const [justEnabled, setJustEnabled] = useState(false);
  // Bumped after a request that does NOT turn the reminder on (permission
  // refused), since nothing else would otherwise cause a re-render to pick
  // up the freshly-denied permission.
  const [, forceRefresh] = useState(0);

  const enabled = Boolean(reminder);
  const time = reminder?.time ?? DEFAULT_TIME;

  async function toggle() {
    if (enabled) {
      deleteReminder(playlistKey);
      return;
    }
    const result = await requestNotificationPermission();
    if (result !== "granted") {
      forceRefresh((n) => n + 1);
      return;
    }
    saveReminder({ key: playlistKey, title, cover, time: DEFAULT_TIME });
    // A visible confirmation right away, rather than asking for trust that
    // something will happen hours later at the chosen time.
    new Notification(`ตั้งเตือน "${title}" แล้ว`, {
      body: `จะเตือนเวลา ${DEFAULT_TIME} น. ถ้าวันนั้นยังไม่ได้สวดบทนี้`,
      tag: `reminder-${playlistKey}`,
    });
    setJustEnabled(true);
    setTimeout(() => setJustEnabled(false), 4000);
  }

  if (permission === "unsupported") {
    return (
      <section className={compact ? "" : "mt-8 rounded-xl bg-surface p-4"}>
        <p className="type-caption text-muted">
          เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน
        </p>
      </section>
    );
  }

  return (
    <section className={compact ? "" : "mt-8"}>
      {!compact && (
        <>
          <h2 className="type-feature text-ink">เตือนบทนี้</h2>
          <p className="mt-1 type-small text-muted">
            ตั้งเวลาไว้ ถ้าวันนั้นยังไม่ได้สวดบทนี้เลยจะเด้งเตือนให้
          </p>
        </>
      )}

      <div className={compact ? "" : "mt-3 rounded-xl bg-surface p-4"}>
        <label className="flex cursor-pointer items-center gap-3">
          <span
            className={`grid size-6 shrink-0 place-items-center rounded-md transition-colors ${
              enabled
                ? "bg-green text-on-green"
                : "border border-line-light text-transparent"
            }`}
          >
            <CheckIcon size={14} />
          </span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggle}
            className="sr-only"
          />
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mid text-muted">
            <BellIcon size={18} />
          </span>
          <span className="min-w-0">
            <span className="block type-caption text-ink">
              {enabled ? "เปิดการแจ้งเตือนอยู่" : "เปิดการแจ้งเตือน"}
            </span>
            {permission === "denied" && (
              <span className="block type-small text-muted">
                เบราว์เซอร์ปฏิเสธไว้ก่อนหน้านี้ — ต้องไปเปิดเองในตั้งค่าเว็บไซต์ของเบราว์เซอร์
              </span>
            )}
          </span>
        </label>

        {enabled && (
          <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
            <label className="flex items-center gap-3">
              <span className="type-caption text-ink">เตือนเวลา</span>
              <input
                type="time"
                value={time}
                onChange={(e) =>
                  saveReminder({ key: playlistKey, title, cover, time: e.target.value })
                }
                className="input-inset rounded-lg bg-mid px-3 py-2 type-caption text-ink outline-none transition-shadow [color-scheme:dark]"
              />
            </label>
          </div>
        )}

        {justEnabled && (
          <p className="mt-3 type-small-bold text-green">
            ส่งแจ้งเตือนทดสอบไปแล้ว ลองดูที่การแจ้งเตือนของเครื่อง
          </p>
        )}
      </div>
    </section>
  );
}
