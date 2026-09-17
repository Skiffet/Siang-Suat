"use client";

/**
 * "Remind me about this one at this time, that one at that time" — one
 * reminder per playlist, each with its own on/off and time, rather than a
 * single app-wide alarm.
 *
 * Still local browser notifications, not push: there is no server here, so
 * this only fires while some tab of the site is open somewhere, checked on
 * an interval. Close the tab and nothing fires no matter what time is set.
 */
export interface Reminder {
  /** "curated:<slug>" for one of ours, "mine:<id>" for one made in the browser. */
  key: string;
  /** Shown in the notification and wherever reminders are listed. */
  title: string;
  cover: string;
  /** 24-hour "HH:MM", compared against the visitor's own local clock. */
  time: string;
}

const REMINDERS_KEY = "siang-suad.reminders.v1";
const lastPlayedKey = (key: string) => `siang-suad.reminder.last-played.${key}`;
const lastNotifiedKey = (key: string) => `siang-suad.reminder.last-notified.${key}`;

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

function readList(): Reminder[] {
  const raw = readRaw(REMINDERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Reminder[];
  } catch {
    return [];
  }
}

// See lib/myPlaylists.ts for why a store shared across mounted components
// needs an explicit subscribe/notify pair: the component that changes a
// reminder and the one polling to fire it are not the same component, and
// neither remounts when the other writes.
const listeners = new Set<() => void>();
function notify() {
  for (const l of listeners) l();
}

function writeList(list: Reminder[]): boolean {
  const ok = writeRaw(REMINDERS_KEY, JSON.stringify(list));
  if (ok) notify();
  return ok;
}

export function subscribeReminders(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === REMINDERS_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

const EMPTY: Reminder[] = [];
let cachedRaw: string | null | undefined;
let cachedList: Reminder[] = EMPTY;

/** For `useSyncExternalStore`'s getSnapshot — cached so an unchanged read
 *  returns the same reference (see myPlaylists.ts for why that matters). */
export function getRemindersSnapshot(): Reminder[] {
  const raw = readRaw(REMINDERS_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = raw ? (() => {
      try {
        return JSON.parse(raw) as Reminder[];
      } catch {
        return EMPTY;
      }
    })() : EMPTY;
  }
  return cachedList;
}

export function getRemindersServerSnapshot(): Reminder[] {
  return EMPTY;
}

export function getReminder(key: string): Reminder | undefined {
  return getRemindersSnapshot().find((r) => r.key === key);
}

export function saveReminder(reminder: Reminder): boolean {
  const list = readList();
  const at = list.findIndex((r) => r.key === reminder.key);
  if (at >= 0) list[at] = reminder;
  else list.push(reminder);
  return writeList(list);
}

export function deleteReminder(key: string): boolean {
  return writeList(readList().filter((r) => r.key !== key));
}

/** Call when a playlist's own play button is pressed — that press is the
 *  clearest signal that today's routine happened. */
export function markPlaylistPlayedToday(key: string): void {
  writeRaw(lastPlayedKey(key), todayKey());
}

function hasPlayedToday(key: string): boolean {
  return readRaw(lastPlayedKey(key)) === todayKey();
}

function hasNotifiedToday(key: string): boolean {
  return readRaw(lastNotifiedKey(key)) === todayKey();
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
 * Fire whichever reminders are due. Cheap to call often: each reminder that
 * has already fired or already been played today costs a couple of
 * localStorage reads and a string compare.
 */
export function checkAndNotify(): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const now = new Date();
  for (const reminder of getRemindersSnapshot()) {
    if (hasPlayedToday(reminder.key) || hasNotifiedToday(reminder.key)) continue;

    const [hh, mm] = reminder.time.split(":").map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) continue;
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
    if (now < target) continue;

    new Notification(`ยังไม่ได้สวด "${reminder.title}" วันนี้`, {
      body: "แตะเพื่อเปิดฟังตอนนี้เลย",
      icon: `/covers/${reminder.cover}.jpg`,
      tag: `reminder-${reminder.key}`, // replaces yesterday's rather than piling up
    });
    writeRaw(lastNotifiedKey(reminder.key), todayKey());
  }
}
