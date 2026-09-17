"use client";

import Link from "next/link";
import type { PlaylistWithChants } from "@/lib/types";
import { isPlayingIn } from "@/lib/nowPlaying";
import { Cover } from "./Cover";
import { EqualizerIcon, PauseIcon, PlayIcon } from "./Icons";
import { usePlayer } from "./player/PlayerProvider";

/**
 * The quick-pick tiles at the top of the home screen — the first thing under
 * the search bar, and deliberately built to read as a hero row rather than a
 * plain list. A thin text row here would have made the covers below it, which
 * are square and full-size, the only thing on the page carrying any visual
 * weight.
 *
 * Pressing the play circle starts the whole playlist; pressing the tile
 * itself opens it. The circle is always visible, not hover-revealed — a
 * touch device has no hover to reveal it with.
 */
export function PlaylistGrid({ playlists }: { playlists: PlaylistWithChants[] }) {
  const { playQueue, current, playing, toggle } = usePlayer();

  return (
    <div className="grid grid-cols-2 gap-3 px-4 lg:grid-cols-3 lg:px-0">
      {playlists.map((playlist) => {
        const active = isPlayingIn(playlist.items, current?.slug);
        return (
          <Link
            key={playlist.slug}
            href={`/playlist/${playlist.slug}`}
            className="group relative overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-elevated)] transition-colors duration-200 hover:bg-card"
          >
            <Cover
              src={playlist.cover}
              alt={playlist.title}
              sizes="(min-width: 1024px) 260px, 45vw"
              rounded="rounded-none"
              className="aspect-[4/3]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
            />

            <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
              <span className="min-w-0">
                <span className="block truncate type-body-bold text-ink">
                  {playlist.title}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 type-small text-near-white">
                  {active && playing && <EqualizerIcon size={12} />}
                  {playlist.items.length} ตอน
                </span>
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (active) toggle();
                  else playQueue(playlist.items);
                }}
                aria-label={
                  active && playing
                    ? `หยุด ${playlist.title}`
                    : `เล่นเพลย์ลิสต์ ${playlist.title}`
                }
                className="grid size-11 shrink-0 place-items-center rounded-full bg-green text-on-green shadow-[var(--shadow-elevated)] transition-transform duration-150 hover:scale-105 active:scale-95"
              >
                {active && playing ? (
                  <PauseIcon size={18} />
                ) : (
                  <PlayIcon size={18} className="translate-x-[1px]" />
                )}
              </button>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
