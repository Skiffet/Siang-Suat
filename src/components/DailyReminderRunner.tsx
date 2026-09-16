"use client";

import { useEffect } from "react";
import { checkAndNotify, markVisitedToday } from "@/lib/reminder";

/**
 * Renders nothing. Marks today as visited once, then polls every 30s for the
 * rest of the session so the reminder can fire the moment its time arrives
 * without needing the settings screen open.
 *
 * Mounted once at the root, alongside PlayerProvider — both are the same
 * shape of thing: state that has to survive whichever page is on screen.
 */
export function DailyReminderRunner() {
  useEffect(() => {
    markVisitedToday();
    checkAndNotify(); // covers opening the tab right at or after the target time
    const id = setInterval(checkAndNotify, 30_000);
    return () => clearInterval(id);
  }, []);

  return null;
}
