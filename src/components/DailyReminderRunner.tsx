"use client";

import { useEffect } from "react";
import { checkAndNotify } from "@/lib/reminder";

/**
 * Renders nothing. Polls every 30s for the rest of the session so any
 * playlist's reminder can fire the moment its time arrives without needing
 * that playlist's own page open.
 *
 * Mounted once at the root, alongside PlayerProvider — both are the same
 * shape of thing: state that has to survive whichever page is on screen.
 */
export function DailyReminderRunner() {
  useEffect(() => {
    checkAndNotify(); // covers opening a tab right at or after some reminder's time
    const id = setInterval(checkAndNotify, 30_000);
    return () => clearInterval(id);
  }, []);

  return null;
}
