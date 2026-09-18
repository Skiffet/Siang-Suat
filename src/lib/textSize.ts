"use client";

/**
 * How big the chant text reads in the follow-along view.
 *
 * A physical chanting booklet is printed at one size; this doesn't have to
 * be, and the readers who most want a bigger version — chanting in dim
 * light, at arm's length propped on a cushion — are exactly the ones a
 * fixed size shuts out.
 */
export const TEXT_SIZE_STEPS = [0.85, 1, 1.15, 1.3] as const;
export const TEXT_SIZE_LABELS = ["เล็ก", "ปกติ", "ใหญ่", "ใหญ่มาก"] as const;
const DEFAULT_SCALE = 1;

const KEY = "siang-suad.text-size.v1";

export function loadTextSize(): number {
  try {
    const raw = localStorage.getItem(KEY);
    const scale = raw ? Number(raw) : DEFAULT_SCALE;
    return (TEXT_SIZE_STEPS as readonly number[]).includes(scale)
      ? scale
      : DEFAULT_SCALE;
  } catch {
    return DEFAULT_SCALE;
  }
}

export function saveTextSize(scale: number): void {
  try {
    localStorage.setItem(KEY, String(scale));
  } catch {
    // Private window or blocked storage — the choice just won't outlive the tab.
  }
}
