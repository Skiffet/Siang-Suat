"use client";

import Link from "next/link";
import type { PlaylistWithChants } from "@/lib/types";
import { Cover } from "./Cover";
import { EqualizerIcon, PauseIcon, PlayIcon } from "./Icons";
import { usePlayer } from "./player/PlayerProvider";

/**
 * The wide quick-pick tiles at the top of the home screen.
 *
 * Pressing one starts the whole playlist rather than opening it — this row is
 * for the listener who already knows what they want.
 */
export function PlaylistGrid({ playlists }: { playlists: PlaylistWithChants[] }) {
  const { playQueue, current, playing, toggle } = usePlayer();

  return (
    <div className="grid grid-cols-2 gap-2 px-4 lg:grid-cols-3 lg:px-0">
      {playlists.map((playlist) => {
        const active =
          current != null && playlist.chants.includes(current.slug);
        return (
          <Link
            key={playlist.slug}
            href={`/playlist/${playlist.slug}`}
            className="group flex items-center gap-3 overflow-hidden rounded-md bg-mid pr-2 transition-colors duration-200 hover:bg-card"
          >
            <Cover
              src={playlist.cover}
              alt={playlist.title}
              sizes="80px"
              rounded="rounded-none"
              className="w-14 shrink-0 sm:w-[72px]"
            />
            <span className="min-w-0 flex-1 truncate type-small-bold text-ink sm:type-caption-bold">
              {playlist.title}
            </span>
            {active && playing && <EqualizerIcon size={14} />}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (active) toggle();
                else playQueue(playlist.items);
              }}
              aria-label={`เล่นเพลย์ลิสต์ ${playlist.title}`}
              className={`hidden size-10 shrink-0 place-items-center rounded-full bg-green text-on-green shadow-[var(--shadow-elevated)] transition-all duration-200 hover:scale-105 sm:grid ${
                active && playing
                  ? "opacity-100"
                  : "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
              }`}
            >
              {active && playing ? (
                <PauseIcon size={16} />
              ) : (
                <PlayIcon size={16} className="translate-x-[1px]" />
              )}
            </button>
          </Link>
        );
      })}
    </div>
  );
}
