"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import type { ChantWithAudio, PlaylistWithChants } from "@/lib/types";
import { formatDurationLong } from "@/lib/format";
import {
  getMyPlaylistsServerSnapshot,
  getMyPlaylistsSnapshot,
  newMyPlaylistId,
  resolveMyPlaylist,
  subscribeMyPlaylists,
} from "@/lib/myPlaylists";
import { Cover } from "./Cover";
import { EqualizerIcon, PlusIcon } from "./Icons";
import { isPlayingIn } from "@/lib/nowPlaying";
import { usePlayer } from "./player/PlayerProvider";

/**
 * Playlists — the ones you made, and the ones we arranged.
 *
 * They are the same kind of thing, so they sit on one screen rather than
 * being split across a library and a browse page. The difference is only who
 * arranged them: yours can be edited, ours are shortcuts to start from.
 */
export function PlaylistsView({
  playlists,
  chants,
}: {
  playlists: PlaylistWithChants[];
  chants: ChantWithAudio[];
}) {
  const router = useRouter();
  const { current, playing } = usePlayer();
  const bySlug = useMemo(
    () => new Map(chants.map((c) => [c.slug, c])),
    [chants],
  );

  // Reactive, not a one-shot read: creating, editing or deleting a playlist
  // from its own editor navigates back here, and this list has to reflect
  // that the moment it lands rather than on the next full page load.
  const mine = useSyncExternalStore(
    subscribeMyPlaylists,
    getMyPlaylistsSnapshot,
    getMyPlaylistsServerSnapshot,
  );

  const isPlaying = (items: { slug: string }[]) =>
    playing && isPlayingIn(items, current?.slug);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      <h1 className="type-section text-ink">เพลย์ลิสต์</h1>
      <p className="mt-1 type-caption text-muted">
        จัดลำดับบทสวดและจำนวนจบเองได้ หรือเริ่มจากชุดที่จัดไว้ให้
      </p>

      {/*
        The id is minted on the click rather than while rendering: it is made
        from the clock, so rendering it would give the server and the browser
        different answers and break hydration.
      */}
      <button
        type="button"
        onClick={() => router.push(`/playlist/edit/${newMyPlaylistId()}`)}
        className="mt-5 flex w-full items-center gap-3 rounded-xl bg-surface px-4 py-4 text-left transition-colors hover:bg-card"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-green text-on-green">
          <PlusIcon size={22} />
        </span>
        <span className="min-w-0">
          <span className="block type-caption-bold text-ink">
            สร้างเพลย์ลิสต์ใหม่
          </span>
          <span className="block type-small text-muted">
            เลือกบท เรียงลำดับ กำหนดว่าบทไหนกี่จบ
          </span>
        </span>
      </button>

      {mine.length > 0 && (
        <section className="mt-8">
          <h2 className="type-feature text-ink">ของฉัน</h2>
          <ul className="mt-3 space-y-1">
            {mine.map((saved) => {
              const items = resolveMyPlaylist(saved, bySlug);
              const total = items.reduce(
                (n, c) => n + (c.durationSec ?? 0) * c.rounds,
                0,
              );
              const live = isPlaying(items);
              return (
                <li key={saved.id}>
                  {/*
                   * Same pattern as a curated playlist: the row opens the
                   * view-and-play page rather than starting playback itself.
                   * Editing is a separate, explicit action next to it.
                   */}
                  <Link
                    href={`/playlist/mine/${saved.id}`}
                    className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-card-alt"
                  >
                    <Cover
                      src={saved.cover}
                      alt={saved.title}
                      sizes="48px"
                      className="w-12 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate type-caption-bold ${live ? "text-green" : "text-ink"}`}
                      >
                        {saved.title}
                      </span>
                      <span className="block truncate type-small text-muted">
                        {items.length} บท · {formatDurationLong(total)}
                      </span>
                    </span>
                    {live && <EqualizerIcon size={16} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="type-feature text-ink">จัดไว้ให้</h2>
        <p className="mt-1 type-small text-muted">
          ชุดสำเร็จสำหรับเริ่มเร็ว ๆ — กดแล้วสวดได้เลย
        </p>
        <ul className="mt-3 space-y-1">
          {playlists.map((playlist) => {
            const live = isPlaying(playlist.items);
            return (
              <li key={playlist.slug}>
                <Link
                  href={`/playlist/${playlist.slug}`}
                  className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-card-alt"
                >
                  <Cover
                    src={playlist.cover}
                    alt={playlist.title}
                    sizes="48px"
                    className="w-12 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate type-caption-bold ${live ? "text-green" : "text-ink"}`}
                    >
                      {playlist.title}
                    </span>
                    <span className="block truncate type-small text-muted">
                      {playlist.items.length} บท ·{" "}
                      {formatDurationLong(playlist.totalSec)}
                    </span>
                  </span>
                  {live && <EqualizerIcon size={16} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
