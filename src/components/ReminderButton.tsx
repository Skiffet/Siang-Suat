"use client";

import { useEffect, useRef, useState } from "react";
import { PlaylistReminderSettings } from "./PlaylistReminderSettings";
import { BellIcon } from "./Icons";

/**
 * A bell next to a specific playlist's controls, opening that playlist's own
 * reminder — "remind me about this one at this time." Each playlist keeps
 * its own on/off and time; this is not a shortcut to one shared setting.
 */
export function ReminderButton({
  playlistKey,
  title,
  cover,
}: {
  playlistKey: string;
  title: string;
  cover: string;
}) {
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
        aria-label={`ตั้งเตือน ${title}`}
        aria-expanded={open}
        className="grid size-9 shrink-0 place-items-center rounded-full border border-line-light text-muted transition-colors hover:text-ink"
      >
        <BellIcon size={18} />
      </button>

      {open && (
        <div className="animate-fade-in absolute left-0 top-full z-50 mt-2 w-64 rounded-xl bg-card p-4 shadow-[var(--shadow-dialog)]">
          <p className="mb-3 type-small text-muted">
            เตือนถ้าวันนั้นยังไม่ได้สวด &ldquo;{title}&rdquo;
          </p>
          <PlaylistReminderSettings playlistKey={playlistKey} title={title} cover={cover} compact />
        </div>
      )}
    </div>
  );
}
