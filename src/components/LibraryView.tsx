"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { ChantWithAudio, PlaylistWithChants, QueuedChant } from "@/lib/types";
import { formatDurationLong } from "@/lib/format";
import { loadSittings, newSittingId, type Sitting } from "@/lib/sittings";
import { Cover } from "./Cover";
import { EqualizerIcon, PlusIcon } from "./Icons";
import { usePlayer } from "./player/PlayerProvider";

const neverChanges = () => () => {};

/** Turn a stored sitting into a queue, resolving counts and the opening นะโม. */
function resolveSitting(
  sitting: Sitting,
  bySlug: Map<string, ChantWithAudio>,
): QueuedChant[] {
  const out: QueuedChant[] = [];
  for (const entry of sitting.entries) {
    const spec = typeof entry === "string" ? { slug: entry } : entry;
    const chant = bySlug.get(spec.slug);
    if (!chant) continue;
    if (typeof entry !== "string" && entry.namo) {
      const namo = bySlug.get("namo-tassa");
      if (namo && !out.some((c) => c.slug === "namo-tassa")) {
        out.push({ ...namo, rounds: namo.defaultRounds ?? 1 });
      }
    }
    out.push({ ...chant, rounds: spec.rounds ?? chant.defaultRounds ?? 1 });
  }
  return out;
}

/**
 * The library screen.
 *
 * Favourites and downloads belong here too, but neither is implemented yet,
 * and a tab that lists every chant and calls them "saved" is worse than no
 * tab at all. They come back when there is something real behind them.
 */
export function LibraryView({
  playlists,
  chants,
}: {
  playlists: PlaylistWithChants[];
  chants: ChantWithAudio[];
}) {
  const { current, playing, playQueue } = usePlayer();
  const bySlug = useMemo(() => new Map(chants.map((c) => [c.slug, c])), [chants]);

  // Sittings live in the browser, so they cannot be read until it is there.
  const onClient = useSyncExternalStore(neverChanges, () => true, () => false);
  const [sittings] = useState<Sitting[]>(() =>
    typeof window === "undefined" ? [] : loadSittings(),
  );

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      <h1 className="type-section text-ink">ห้องสมุด</h1>
      <p className="mt-1 type-caption text-muted">
        {playlists.length} เพลย์ลิสต์
        {onClient && sittings.length > 0 && ` · ${sittings.length} การสวดของคุณ`}
      </p>

      {onClient && (
        <section className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="type-feature text-ink">การสวดของคุณ</h2>
          </div>

          <ul className="mt-3 space-y-1">
            <li>
              <Link
                href={`/sitting/${newSittingId()}`}
                className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-card-alt"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-md bg-mid text-muted">
                  <PlusIcon size={22} />
                </span>
                <span className="min-w-0">
                  <span className="block type-caption-bold text-ink">
                    จัดการสวดเอง
                  </span>
                  <span className="block type-small text-muted">
                    เลือกบทและกำหนดว่าจะสวดบทละกี่จบ
                  </span>
                </span>
              </Link>
            </li>

            {sittings.map((sitting) => {
              const items = resolveSitting(sitting, bySlug);
              const total = items.reduce(
                (n, c) => n + (c.durationSec ?? 0) * c.rounds,
                0,
              );
              const nowPlaying =
                playing &&
                current != null &&
                items.some((c) => c.slug === current.slug);
              return (
                <li key={sitting.id} className="group flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => playQueue(items)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-card-alt"
                  >
                    <Cover
                      src={sitting.cover}
                      alt={sitting.title}
                      sizes="48px"
                      className="w-12 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate type-caption-bold ${nowPlaying ? "text-green" : "text-ink"}`}
                      >
                        {sitting.title}
                      </span>
                      <span className="block truncate type-small text-muted">
                        {items.length} บท · {formatDurationLong(total)}
                      </span>
                    </span>
                    {nowPlaying && <EqualizerIcon size={16} />}
                  </button>
                  <Link
                    href={`/sitting/${sitting.id}`}
                    className="shrink-0 rounded-full px-3 py-2 type-small-bold text-muted transition-colors hover:bg-mid hover:text-ink"
                  >
                    แก้ไข
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <h2 className="mt-8 type-feature text-ink">เพลย์ลิสต์แนะนำ</h2>

      <ul className="mt-3 space-y-1">
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
