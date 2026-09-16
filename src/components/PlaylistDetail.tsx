"use client";

import type { PlaylistWithChants } from "@/lib/types";
import { formatDurationLong } from "@/lib/format";
import { Cover } from "./Cover";
import { TrackRow } from "./TrackRow";
import { usePlayer } from "./player/PlayerProvider";
import { PauseIcon, PlayIcon, ShuffleIcon } from "./Icons";

export function PlaylistDetail({ playlist }: { playlist: PlaylistWithChants }) {
  const { playQueue, current, playing, toggle, shuffle, toggleShuffle } = usePlayer();
  const active = current != null && playlist.chants.includes(current.slug);
  const playable = playlist.items.filter((c) => c.audioUrl).length;

  return (
    <article>
      <header className="relative px-4 pb-6 pt-[calc(24px+env(safe-area-inset-top))] lg:px-8 lg:pt-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-25 blur-3xl"
          style={{
            backgroundImage: `url(/covers/${playlist.cover}.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
          <Cover
            src={playlist.cover}
            alt={playlist.title}
            sizes="(min-width: 640px) 220px, 55vw"
            preload
            className="w-40 shrink-0 self-center shadow-[var(--shadow-dialog)] sm:w-[220px] sm:self-auto"
          />
          <div className="min-w-0 flex-1">
            <p className="type-micro uppercase tracking-[1.4px] text-muted">เพลย์ลิสต์</p>
            <h1 className="mt-2 type-section text-ink sm:text-[40px] sm:leading-tight">
              {playlist.title}
            </h1>
            <p className="mt-3 max-w-[60ch] type-caption text-muted">
              {playlist.description}
            </p>
            <p className="mt-2 type-small text-muted">
              เสียงสวด Podcast · {playlist.items.length} ตอน ·{" "}
              {formatDurationLong(playlist.totalSec)}
            </p>
          </div>
        </div>

        <div className="relative mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => (active ? toggle() : playQueue(playlist.items))}
            disabled={playable === 0}
            aria-label={active && playing ? "หยุดชั่วคราว" : `เล่น ${playlist.title}`}
            className="grid size-14 place-items-center rounded-full bg-green text-on-green transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            {active && playing ? (
              <PauseIcon size={24} />
            ) : (
              <PlayIcon size={24} className="translate-x-[2px]" />
            )}
          </button>
          <button
            type="button"
            onClick={toggleShuffle}
            aria-pressed={shuffle}
            aria-label="สุ่มลำดับ"
            className={`transition-colors ${shuffle ? "text-green" : "text-muted hover:text-ink"}`}
          >
            <ShuffleIcon size={24} />
          </button>
        </div>
      </header>

      <div className="space-y-0.5 px-4 lg:px-8">
        {playlist.items.map((chant, i) => (
          <TrackRow
            key={chant.slug}
            chant={chant}
            queue={playlist.items}
            position={i + 1}
          />
        ))}
      </div>
    </article>
  );
}
