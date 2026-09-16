"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import type { ChantWithAudio } from "@/lib/types";
import {
  getMyPlaylistsServerSnapshot,
  getMyPlaylistsSnapshot,
  resolveMyPlaylist,
  subscribeMyPlaylists,
} from "@/lib/myPlaylists";
import { PlaylistDetail } from "./PlaylistDetail";

/**
 * A saved playlist's own page — the view-and-play screen a click on it should
 * land on, matching how a curated playlist behaves. Editing is a step away
 * behind the pencil icon, not the destination of the click itself.
 *
 * Reactive rather than a one-shot read: coming back here from the editor
 * (save, rename, reorder) has to show the result immediately.
 */
export function MyPlaylistDetail({
  id,
  chants,
}: {
  id: string;
  chants: ChantWithAudio[];
}) {
  const bySlug = useMemo(() => new Map(chants.map((c) => [c.slug, c])), [chants]);
  const saved = useSyncExternalStore(
    subscribeMyPlaylists,
    () => getMyPlaylistsSnapshot().find((p) => p.id === id),
    () => getMyPlaylistsServerSnapshot().find((p) => p.id === id),
  );

  if (!saved) {
    return (
      <div className="px-4 py-10 text-center lg:px-8">
        <p className="type-caption text-muted">
          ไม่พบเพลย์ลิสต์นี้ — อาจถูกลบไปแล้ว หรือเก็บไว้ในเบราว์เซอร์อื่น
        </p>
        <Link
          href="/playlist"
          className="mt-4 inline-block type-small-bold text-ink underline"
        >
          กลับไปหน้าเพลย์ลิสต์
        </Link>
      </div>
    );
  }

  const items = resolveMyPlaylist(saved, bySlug);
  const totalSec = items.reduce((n, c) => n + (c.durationSec ?? 0) * c.rounds, 0);

  return (
    <PlaylistDetail
      playlist={{
        slug: saved.id,
        title: saved.title,
        description: "เพลย์ลิสต์ที่คุณจัดเอง",
        cover: saved.cover,
        chants: saved.entries,
        items,
        totalSec,
      }}
      editHref={`/playlist/edit/${saved.id}`}
    />
  );
}
