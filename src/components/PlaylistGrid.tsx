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
    <div className="grid grid-cols-3 gap-2 px-4 lg:grid-cols-4 lg:px-0">
      {/*
       * The id is minted on the click rather than while rendering — it comes
       * from the clock, so rendering it here would give the server and the
       * browser different hrefs and break hydration (see PlaylistsView's own
       * create button, which hit exactly this). Rendered as a small circle
       * rather than a full card so it reads as an action sitting among the
       * playlist tiles, not another playlist-sized box.
       */}
      <button
        type="button"
        onClick={() => router.push(`/playlist/edit/${newMyPlaylistId()}`)}
        className="group flex aspect-[16/9] flex-col items-center justify-center gap-1 text-center"
      >
        <span className="grid size-9 place-items-center rounded-full bg-green text-on-green shadow-[var(--shadow-elevated)] transition-transform duration-150 group-hover:scale-105">
          <PlusIcon size={14} />
        </span>
        <span className="type-micro text-muted">สร้างใหม่</span>
      </button>

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
  );
}
