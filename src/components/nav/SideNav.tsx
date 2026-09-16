"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import type { ChantWithAudio, PlaylistWithChants } from "@/lib/types";
import {
  getMyPlaylistsServerSnapshot,
  getMyPlaylistsSnapshot,
  resolveMyPlaylist,
  subscribeMyPlaylists,
} from "@/lib/myPlaylists";
import { isPlayingIn } from "@/lib/nowPlaying";
import { Brand } from "../Brand";
import { EqualizerIcon } from "../Icons";
import { usePlayer } from "../player/PlayerProvider";
import { NAV_ITEMS } from "./navItems";
import { NavIcon } from "./NavIcon";

/**
 * The desktop sidebar.
 *
 * Per DESIGN.md it shares the page's base colour with no separator, and the
 * active entry is signalled by weight and a white fill rather than a coloured
 * background — the green is spent on playback, not on navigation chrome.
 */
export function SideNav({
  playlists,
  chants,
}: {
  playlists: PlaylistWithChants[];
  chants: ChantWithAudio[];
}) {
  const pathname = usePathname();
  const { current, playing } = usePlayer();
  const bySlug = useMemo(
    () => new Map(chants.map((c) => [c.slug, c])),
    [chants],
  );

  // Reactive rather than a one-shot read: this sidebar mounts once in the
  // root layout and never remounts on navigation, so it has to hear about a
  // save or delete made from any other page in the same session.
  const mine = useSyncExternalStore(
    subscribeMyPlaylists,
    getMyPlaylistsSnapshot,
    getMyPlaylistsServerSnapshot,
  );

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col gap-2 p-2 lg:flex xl:w-[280px]">
      {/* No tagline here — at sidebar width it wraps to an orphan line. */}
      <div className="rounded-lg bg-surface px-5 py-4">
        <Brand />
      </div>

      <nav className="rounded-lg bg-surface px-3 py-3">
        <ul>
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-4 rounded-md px-3 py-2.5 transition-colors duration-150 ${
                    active
                      ? "type-caption-bold text-ink"
                      : "type-caption text-muted hover:text-ink"
                  }`}
                >
                  <NavIcon name={item.icon} active={active} size={22} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-surface">
        <div className="px-5 py-4">
          <h2 className="type-caption-bold text-muted">เพลย์ลิสต์</h2>
        </div>

        <ul className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {mine.map((saved) => {
            const items = resolveMyPlaylist(saved, bySlug);
            const nowPlaying = playing && isPlayingIn(items, current?.slug);
            return (
              <li key={saved.id}>
                <Link
                  href={`/playlist/edit/${saved.id}`}
                  className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-card"
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate type-caption ${nowPlaying ? "text-green" : "text-ink"}`}
                    >
                      {saved.title}
                    </span>
                    <span className="block truncate type-small text-muted">
                      {items.length} ตอน
                    </span>
                  </span>
                  {nowPlaying && <EqualizerIcon size={14} />}
                </Link>
              </li>
            );
          })}

          {playlists.map((playlist) => {
            const nowPlaying =
              playing && isPlayingIn(playlist.items, current?.slug);
            return (
              <li key={playlist.slug}>
                <Link
                  href={`/playlist/${playlist.slug}`}
                  className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-card"
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate type-caption ${nowPlaying ? "text-green" : "text-ink"}`}
                    >
                      {playlist.title}
                    </span>
                    <span className="block truncate type-small text-muted">
                      {playlist.items.length} ตอน
                    </span>
                  </span>
                  {nowPlaying && <EqualizerIcon size={14} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
