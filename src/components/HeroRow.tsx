"use client";

import { useSyncExternalStore } from "react";
import { greetingForHour } from "@/lib/format";

/** The hour never changes while the page is open, so there is nothing to subscribe to. */
const noSubscribe = () => () => {};

/**
 * The desktop greeting.
 *
 * The hour has to come from the reader's clock. Every page here is prerendered
 * once at build time, so a server-rendered greeting would freeze at whatever
 * time the deploy happened — someone opening the app at 2am would be told
 * "good afternoon". Returning null for the server snapshot keeps the markup
 * matching until hydration fills the real hour in.
 */
export function HeroRow() {
  const hour = useSyncExternalStore(
    noSubscribe,
    () => new Date().getHours(),
    () => null,
  );

  return (
    <div className="mb-6">
      {/* A non-breaking space holds the line's height for the first paint. */}
      <h1 className="type-section text-ink">
        {hour == null ? " " : greetingForHour(hour)}
      </h1>
      <p className="mt-1 type-caption text-muted">
        เสียงดี ใจสงบ ชีวิตดีขึ้น — สวดได้ทุกที่ ทุกเวลา บนเส้นทางของคุณ
      </p>
    </div>
  );
}
