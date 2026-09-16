/** Seconds to "m:ss". Used on cards, the scrubber and the mini player. */
export function formatTime(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "--:--";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Greeting keyed to the hour, per DESIGN.md §3.1. Also picks which chant gets
 * suggested when there is nothing to resume.
 */
export function greetingForHour(hour: number): string {
  if (hour >= 4 && hour < 11) return "สวัสดีตอนเช้า";
  if (hour >= 11 && hour < 15) return "สวัสดีตอนบ่าย";
  if (hour >= 15 && hour < 19) return "สวัสดีตอนเย็น";
  return "ราตรีสวัสดิ์";
}

/** "6 ชม. 18 นาที" — the long form used on playlist rows and headers. */
export function formatDurationLong(seconds: number | null | undefined): string {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "ยังไม่มีเสียง";
  // Rounding to minutes turns anything under thirty seconds into "0 นาที",
  // which reads as nothing at all when there is in fact something to play.
  if (seconds < 60) return `${Math.round(seconds)} วินาที`;
  const total = Math.round(seconds / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} นาที`;
  return m === 0 ? `${h} ชม.` : `${h} ชม. ${m} นาที`;
}
