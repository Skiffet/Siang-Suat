"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PlaylistWithChants } from "@/lib/types";
import { isPlayingIn } from "@/lib/nowPlaying";
import { newMyPlaylistId } from "@/lib/myPlaylists";
import { markPlaylistPlayedToday } from "@/lib/reminder";
import { Cover } from "./Cover";
import { EqualizerIcon, PauseIcon, PlayIcon, PlusIcon } from "./Icons";
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
  const router = useRouter();
  const { playQueue, current, playing, toggle } = usePlayer();

  return (
    // The "+" tile is a flex sibling next to the grid, not a grid item
    // itself — a fixed-width column would either match the cards' width
    // (leaving a mostly-empty box around a small circle) or, at a narrow
    // width, still get squeezed into a full-width grid track since CSS
    // Grid columns share one size for every row. As a flex sibling it can
    // be narrow and still stretch to the full row height, so the circle
    // centers on both axes right up against the first card.
    <div className="flex gap-2 px-4 lg:px-0">
      <button
        type="button"
        onClick={() => router.push(`/playlist/edit/${newMyPlaylistId()}`)}
        className="group flex w-20 shrink-0 flex-col items-center justify-center gap-1 text-center lg:w-24"
      >
        <span className="grid size-9 place-items-center rounded-full bg-green text-on-green shadow-[var(--shadow-elevated)] transition-transform duration-150 group-hover:scale-105">
          <PlusIcon size={14} />
        </span>
        <span className="type-micro text-muted">สร้างใหม่</span>
      </button>

      {/*
       * auto-fill/minmax instead of a fixed column count so an empty
       * trailing track never stretches the real cards to fill it — the
       * page has no max-width wrapper, so equal-fraction columns would
       * otherwise blow up to fill a wide window.
       */}
      <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
        {playlists.map((playlist) => {
          const active = isPlayingIn(playlist.items, current?.slug);
          return (
            <Link
              key={playlist.slug}
              href={`/playlist/${playlist.slug}`}
              className="group relative overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-elevated)] transition-colors duration-200 hover:bg-card"
            >
              <Cover
                src={playlist.cover}
                alt={playlist.title}
                sizes="(min-width: 1024px) 260px, 45vw"
                rounded="rounded-none"
                className="aspect-[16/9]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
              />

              <span className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate type-small-bold text-ink">
                    {playlist.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 type-micro text-near-white">
                    {active && playing && <EqualizerIcon size={10} />}
                    {playlist.items.length} ตอน
                  </span>
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (active) toggle();
                    else {
                      playQueue(playlist.items);
                      markPlaylistPlayedToday(`curated:${playlist.slug}`);
                    }
                  }}
                  aria-label={
                    active && playing
                      ? `หยุด ${playlist.title}`
                      : `เล่นเพลย์ลิสต์ ${playlist.title}`
                  }
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-green text-on-green shadow-[var(--shadow-elevated)] transition-transform duration-150 hover:scale-105 active:scale-95"
                >
                  {active && playing ? (
                    <PauseIcon size={14} />
                  ) : (
                    <PlayIcon size={14} className="translate-x-[1px]" />
                  )}
                </button>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
