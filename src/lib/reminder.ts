"use client";

/**
 * "You haven't come in today" — a reminder shown as a browser notification.
 *
 * There is no server here, so this cannot be a real push notification: it
 * only fires while some tab of this site is open somewhere (foreground or
 * backgrounded), checked on an interval. Close the tab or the browser and
 * nothing fires, no matter what time is set. A reminder that works even with
 * the browser fully closed needs a server to send it — a separate, much
 * bigger piece of infrastructure this project does not have.
 */
export interface ReminderSettings {
  enabled: boolean;
  /** 24-hour "HH:MM", compared against the visitor's own local clock. */
  time: string;
}

const DEFAULT_SETTINGS: ReminderSettings = { enabled: false, time: "20:00" };

const SETTINGS_KEY = "siang-suad.reminder.v1";
const LAST_VISIT_KEY = "siang-suad.reminder.last-visit";
const LAST_NOTIFIED_KEY = "siang-suad.reminder.last-notified";

/** Local calendar day, so a reminder at 20:00 compares against the visitor's
 *  own midnight rather than UTC's. */
function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

// See lib/myPlaylists.ts for why a store shared across mounted components
// needs an explicit subscribe/notify pair rather than a one-shot read: the
// component that flips the setting and the one driving the timer are not
// the same component, and neither remounts when the other writes.
const listeners = new Set<() => void>();
function notify() {
  for (const l of listeners) l();
}

export function subscribeReminder(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === SETTINGS_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

let cachedRaw: string | null | undefined;
let cachedSettings: ReminderSettings = DEFAULT_SETTINGS;

/** For `useSyncExternalStore`'s getSnapshot — cached so an unchanged read
 *  returns the same reference (see myPlaylists.ts for why that matters). */
export function getReminderSnapshot(): ReminderSettings {
  const raw = readRaw(SETTINGS_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSettings = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      cachedSettings = DEFAULT_SETTINGS;
    }
  }
  return cachedSettings;
}

export function getReminderServerSnapshot(): ReminderSettings {
  return DEFAULT_SETTINGS;
}

export function saveReminderSettings(next: ReminderSettings): boolean {
  const ok = writeRaw(SETTINGS_KEY, JSON.stringify(next));
  if (ok) notify();
  return ok;
}

/** Call once per app load — any page counts as "came in today". */
export function markVisitedToday(): void {
  writeRaw(LAST_VISIT_KEY, todayKey());
}

function hasVisitedToday(): boolean {
  return readRaw(LAST_VISIT_KEY) === todayKey();
}

function hasNotifiedToday(): boolean {
  return readRaw(LAST_NOTIFIED_KEY) === todayKey();
}

export type PermissionState = "default" | "granted" | "denied" | "unsupported";

export function getNotificationPermission(): PermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/** Must be called from a click handler — browsers refuse the prompt otherwise. */
export async function requestNotificationPermission(): Promise<PermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.requestPermission();
}

/**
 * Fire the reminder if it is due. Cheap to call often: every check after the
 * first one that day is a few localStorage reads and a string compare.
 */
export function checkAndNotify(): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  const settings = getReminderSnapshot();
  if (!settings.enabled) return;
  if (Notification.permission !== "granted") return;
  if (hasVisitedToday() || hasNotifiedToday()) return;

  const [hh, mm] = settings.time.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return;
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
  if (now < target) return;

  new Notification("ยังไม่ได้แวะมาสวดมนต์วันนี้", {
    body: "เปิดแอปแล้วเลือกบทสวดสักบทก่อนนอนไหม",
    icon: "/covers/temple-sunrise.jpg",
    tag: "daily-reminder", // replaces yesterday's rather than piling up
  });
  writeRaw(LAST_NOTIFIED_KEY, todayKey());
}
