"use client";

import { useEffect, useRef, useState } from "react";
import { DailyReminderSettings } from "./DailyReminderSettings";
import { BellIcon } from "./Icons";

/**
 * A quick-access way into the daily reminder from wherever someone actually
 * is — a playlist they were about to start, say — rather than making them
 * navigate all the way to their profile to turn it on. Opens the exact same
 * settings the profile page has (one reminder, not a separate one per
 * playlist); this is a shortcut to it, not a second setting.
 */
export function ReminderButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="ตั้งเตือนถ้ายังไม่ได้เข้ามา"
        aria-expanded={open}
        className="grid size-9 shrink-0 place-items-center rounded-full border border-line-light text-muted transition-colors hover:text-ink"
      >
        <BellIcon size={18} />
      </button>

      {open && (
        <div className="animate-fade-in absolute left-0 top-full z-50 mt-2 w-64 rounded-xl bg-card p-4 shadow-[var(--shadow-dialog)]">
          <p className="mb-3 type-small text-muted">
            เตือนถ้าวันนั้นยังไม่ได้เข้ามาเปิดแอปเลย
          </p>
          <DailyReminderSettings compact />
        </div>
      )}
    </div>
  );
}
