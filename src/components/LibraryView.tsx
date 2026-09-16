"use client";

import Link from "next/link";
import type { PlaylistWithChants } from "@/lib/types";
import { formatDurationLong } from "@/lib/format";
import { Cover } from "./Cover";
import { EqualizerIcon } from "./Icons";
import { usePlayer } from "./player/PlayerProvider";

/**
 * The library screen.
 *
 * Favourites and downloads belong here too, but neither is implemented yet,
 * and a tab that lists every chant and calls them "saved" is worse than no
 * tab at all. They come back when there is something real behind them.
 */
export function LibraryView({ playlists }: { playlists: PlaylistWithChants[] }) {
  const { current, playing } = usePlayer();

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      <h1 className="type-section text-ink">ห้องสมุด</h1>
      <p className="mt-1 type-caption text-muted">
        {playlists.length} เพลย์ลิสต์
      </p>

      <ul className="mt-5 space-y-1">
        {playlists.map((playlist) => {
          const nowPlaying =
            playing && current != null && playlist.chants.includes(current.slug);
          return (
            <li key={playlist.slug}>
              <Link
                href={`/playlist/${playlist.slug}`}
                className="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-card-alt"
              >
                <Cover
                  src={playlist.cover}
                  alt={playlist.title}
                  sizes="48px"
                  className="w-12 shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate type-caption-bold ${nowPlaying ? "text-green" : "text-ink"}`}
                  >
                    {playlist.title}
                  </span>
                  <span className="block truncate type-small text-muted">
                    {playlist.items.length} ตอน · {formatDurationLong(playlist.totalSec)}
                  </span>
                </span>
                {nowPlaying && <EqualizerIcon size={16} />}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
