"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ChantWithAudio, PlaylistWithChants } from "@/lib/types";
import { markNavigated } from "@/lib/navHistory";
import { DailyReminderRunner } from "./DailyReminderRunner";
import { BottomNav } from "./nav/BottomNav";
import { SideNav } from "./nav/SideNav";
import { NowPlaying } from "./player/NowPlaying";
import { PlayerBar } from "./player/PlayerBar";
import { usePlayer } from "./player/PlayerProvider";

/**
 * The three-region frame: sidebar, scrolling content, persistent player bar.
 *
 * Below `lg` the sidebar becomes the bottom bar and the player bar sits on top
 * of it. The bottom padding is computed rather than fixed so content always
 * clears whatever chrome is actually on screen.
 */
export function AppShell({
  playlists,
  chants,
  children,
}: {
  playlists: PlaylistWithChants[];
  chants: ChantWithAudio[];
  children: React.ReactNode;
}) {
  const { current, notice } = usePlayer();

  // The very first pathname this tab renders is a landing, not a step
  // forward — only a change away from it means there's now somewhere for a
  // back button to actually return to. Compared against the pathname itself
  // rather than an effect-ran-once ref, since Strict Mode's dev-only double
  // invocation would otherwise mark that first landing as a navigation too.
  const pathname = usePathname();
  const [initialPathname] = useState(pathname);
  useEffect(() => {
    if (pathname !== initialPathname) markNavigated();
  }, [pathname, initialPathname]);

  return (
    <>
      <div className="flex min-h-dvh">
        <SideNav playlists={playlists} chants={chants} />

        <div className="min-w-0 flex-1 lg:p-2 lg:pl-0">
          <main
            className="min-h-full lg:rounded-lg lg:bg-gradient-to-b lg:from-surface lg:to-base"
            style={{
              paddingBottom: current
                ? "calc(150px + env(safe-area-inset-bottom))"
                : "calc(80px + env(safe-area-inset-bottom))",
            }}
          >
            {children}
          </main>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="animate-fade-in fixed inset-x-0 bottom-32 z-40 mx-auto w-fit max-w-[90vw] rounded-full bg-ink px-5 py-3 type-small-bold text-base shadow-[var(--shadow-dialog)] lg:bottom-28"
        >
          {notice}
        </div>
      )}

      <PlayerBar />
      <BottomNav />
      <NowPlaying />
      <DailyReminderRunner />
    </>
  );
}
