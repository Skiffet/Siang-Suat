"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ChantWithAudio, PlaylistEntry } from "@/lib/types";
import {
  getMyPlaylistsServerSnapshot,
  getMyPlaylistsSnapshot,
  newMyPlaylistId,
  saveMyPlaylist,
  subscribeMyPlaylists,
} from "@/lib/myPlaylists";
import { CheckIcon, PlusIcon } from "./Icons";

function slugOf(entry: PlaylistEntry): string {
  return typeof entry === "string" ? entry : entry.slug;
}

/**
 * "+" next to a chant, opening a panel to toggle it in and out of whichever
 * playlists the listener has made — the same shape as Spotify's own
 * add-to-playlist sheet. Ticking one off removes the chant from it rather
 * than needing a separate remove flow.
 */
export function AddToPlaylistButton({
  chant,
  size = 40,
}: {
  chant: ChantWithAudio;
  size?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const mine = useSyncExternalStore(
    subscribeMyPlaylists,
    getMyPlaylistsSnapshot,
    getMyPlaylistsServerSnapshot,
  );

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(playlistId: string, entries: PlaylistEntry[], title: string, cover: string) {
    const has = entries.some((e) => slugOf(e) === chant.slug);
    const next = has
      ? entries.filter((e) => slugOf(e) !== chant.slug)
      : [...entries, chant.slug];
    saveMyPlaylist({ id: playlistId, title, cover, entries: next });
  }

  function createNew() {
    const id = newMyPlaylistId();
    saveMyPlaylist({ id, title: chant.title, cover: chant.cover, entries: [chant.slug] });
    setOpen(false);
    router.push(`/playlist/edit?id=${id}`);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="เพิ่มไปเพลย์ลิสต์"
        aria-expanded={open}
        style={{ width: size, height: size }}
        className="grid shrink-0 place-items-center rounded-full border border-line-light text-muted transition-colors hover:text-ink"
      >
        <PlusIcon size={Math.round(size * 0.4)} />
      </button>

      {open && (
        <div className="animate-fade-in absolute left-0 top-full z-50 mt-2 w-64 rounded-xl bg-card p-2 shadow-[var(--shadow-dialog)]">
          <p className="px-2 py-1.5 type-small text-muted">เพิ่มไปเพลย์ลิสต์</p>

          {mine.length > 0 && (
            <ul className="no-scrollbar max-h-56 overflow-y-auto">
              {mine.map((playlist) => {
                const has = playlist.entries.some((e) => slugOf(e) === chant.slug);
                return (
                  <li key={playlist.id}>
                    <button
                      type="button"
                      onClick={() =>
                        toggle(playlist.id, playlist.entries, playlist.title, playlist.cover)
                      }
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-mid"
                    >
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-md transition-colors ${
                          has
                            ? "bg-green text-on-green"
                            : "border border-line-light text-transparent"
                        }`}
                      >
                        <CheckIcon size={12} />
                      </span>
                      <span className="min-w-0 flex-1 truncate type-caption text-ink">
                        {playlist.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={createNew}
            className="mt-1 flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-mid"
          >
            <span className="grid size-5 shrink-0 place-items-center text-green">
              <PlusIcon size={16} />
            </span>
            <span className="type-caption text-ink">สร้างเพลย์ลิสต์ใหม่</span>
          </button>
        </div>
      )}
    </div>
  );
}
