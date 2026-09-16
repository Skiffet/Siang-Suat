"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PlaylistWithChants } from "@/lib/types";
import { Brand } from "../Brand";
import { EqualizerIcon, PlusIcon } from "../Icons";
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
export function SideNav({ playlists }: { playlists: PlaylistWithChants[] }) {
  const pathname = usePathname();
  const { current, playing } = usePlayer();

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
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="type-caption-bold text-muted">เพลย์ลิสต์ของคุณ</h2>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-mid hover:text-ink"
            aria-label="สร้างเพลย์ลิสต์ใหม่"
          >
            <PlusIcon size={18} />
          </button>
        </div>

        <ul className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {playlists.map((playlist) => {
            const nowPlaying =
              playing && current != null && playlist.chants.includes(current.slug);
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
