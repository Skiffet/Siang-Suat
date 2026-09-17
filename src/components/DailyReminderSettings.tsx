"use client";

import { useState, useSyncExternalStore } from "react";
import {
  getNotificationPermission,
  getReminderServerSnapshot,
  getReminderSnapshot,
  requestNotificationPermission,
  saveReminderSettings,
  subscribeReminder,
  type PermissionState,
} from "@/lib/reminder";
import { BellIcon, CheckIcon } from "./Icons";

const neverChanges = () => () => {};

/**
 * "Remind me if I haven't come in today" — the opening bookend to the sleep
 * timer's closing one.
 *
 * This is not a push notification: nothing here has a server, so it only
 * fires while some tab of this site is open somewhere. Said plainly in the
 * UI rather than left to be discovered the day it silently doesn't fire,
 * because the difference is the whole trust of the feature.
 */
export function DailyReminderSettings({ compact = false }: { compact?: boolean }) {
  const settings = useSyncExternalStore(
    subscribeReminder,
    getReminderSnapshot,
    getReminderServerSnapshot,
  );
  // Browsers give no change event for Notification.permission, so there is
  // nothing real to subscribe to — this is read fresh on every render instead
  // (via the no-op subscribe below), which is enough because the only thing
  // that ever changes it while this component is mounted is `toggle` itself,
  // and that already triggers a re-render through the settings store above.
  const permission = useSyncExternalStore(
    neverChanges,
    getNotificationPermission,
    (): PermissionState => "default",
  );
  const [justEnabled, setJustEnabled] = useState(false);
  // Bumped after a request that does NOT flip `enabled` (permission refused),
  // since nothing else would otherwise cause this component to re-render and
  // pick up the freshly-denied permission.
  const [, forceRefresh] = useState(0);

  async function toggle() {
    if (settings.enabled) {
      saveReminderSettings({ ...settings, enabled: false });
      return;
    }
    const result = await requestNotificationPermission();
    if (result !== "granted") {
      forceRefresh((n) => n + 1);
      return;
    }
    saveReminderSettings({ ...settings, enabled: true });
    // A visible confirmation right away, rather than asking for trust that
    // something will happen hours later at the chosen time.
    new Notification("ตั้งการแจ้งเตือนแล้ว", {
      body: `จะเตือนเวลา ${settings.time} น. ถ้าวันนั้นยังไม่ได้เข้ามา (ต้องเปิดแท็บนี้ค้างไว้)`,
      tag: "daily-reminder",
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
          <h2 className="type-feature text-ink">เตือนถ้ายังไม่ได้เข้ามา</h2>
          <p className="mt-1 type-small text-muted">
            ตั้งเวลาไว้ ถ้าวันนั้นยังไม่ได้เปิดแอปเลยจะเด้งเตือนให้
          </p>
        </>
      )}

      <div className={compact ? "" : "mt-3 rounded-xl bg-surface p-4"}>
        <label className="flex cursor-pointer items-center gap-3">
          <span
            className={`grid size-6 shrink-0 place-items-center rounded-md transition-colors ${
              settings.enabled
                ? "bg-green text-on-green"
                : "border border-line-light text-transparent"
            }`}
          >
            <CheckIcon size={14} />
          </span>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={toggle}
            className="sr-only"
          />
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mid text-muted">
            <BellIcon size={18} />
          </span>
          <span className="min-w-0">
            <span className="block type-caption text-ink">
              {settings.enabled ? "เปิดการแจ้งเตือนอยู่" : "เปิดการแจ้งเตือน"}
            </span>
            {permission === "denied" && (
              <span className="block type-small text-muted">
                เบราว์เซอร์ปฏิเสธไว้ก่อนหน้านี้ — ต้องไปเปิดเองในตั้งค่าเว็บไซต์ของเบราว์เซอร์
              </span>
            )}
          </span>
        </label>

        {settings.enabled && (
          <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
            <label className="flex items-center gap-3">
              <span className="type-caption text-ink">เตือนเวลา</span>
              <input
                type="time"
                value={settings.time}
                onChange={(e) =>
                  saveReminderSettings({ ...settings, time: e.target.value })
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
