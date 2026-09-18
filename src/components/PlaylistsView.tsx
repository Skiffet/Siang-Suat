"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { ChantWithAudio, PlaylistWithChants, QueuedChant } from "@/lib/types";
import { formatDurationLong } from "@/lib/format";
import {
  getMyPlaylistsServerSnapshot,
  getMyPlaylistsSnapshot,
  newMyPlaylistId,
  resolveMyPlaylist,
  subscribeMyPlaylists,
} from "@/lib/myPlaylists";
import { isPlayingIn } from "@/lib/nowPlaying";
import { Cover } from "./Cover";
import { EqualizerIcon, PlusIcon, SearchIcon } from "./Icons";
import { usePlayer } from "./player/PlayerProvider";

type Kind = "mine" | "curated";

/** A playlist, curated or homemade, reduced to what a row needs to show. */
interface PlaylistRow {
  key: string;
  href: string;
  title: string;
  cover: string;
  count: number;
  totalSec: number;
  items: QueuedChant[];
  kind: Kind;
}

const FILTERS: { key: Kind | "all"; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "mine", label: "ของฉัน" },
  { key: "curated", label: "จัดไว้ให้" },
];

/**
 * Playlists — the ones you made, and the ones we arranged.
 *
 * One scrolling list rather than a library split into sections: the chips
 * above it narrow by who arranged it, the same job Spotify's library gives
 * its "playlists / albums" filter, so finding your own stays one tap away
 * without the page having to duplicate that grouping as separate shelves too.
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
  const [filter, setFilter] = useState<Kind | "all">("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Reactive, not a one-shot read: creating, editing or deleting a playlist
  // from its own editor navigates back here, and this list has to reflect
  // that the moment it lands rather than on the next full page load.
  const mine = useSyncExternalStore(
    subscribeMyPlaylists,
    getMyPlaylistsSnapshot,
    getMyPlaylistsServerSnapshot,
  );

  // Yours first — landing here should surface what you made before what we
  // arranged, even while browsing "ทั้งหมด".
  const rows: PlaylistRow[] = [
    ...mine.map((saved): PlaylistRow => {
      const items = resolveMyPlaylist(saved, bySlug);
      return {
        key: `mine:${saved.id}`,
        href: `/playlist/mine?id=${saved.id}`,
        title: saved.title,
        cover: saved.cover,
        count: items.length,
        totalSec: items.reduce((n, c) => n + (c.durationSec ?? 0) * c.rounds, 0),
        items,
        kind: "mine",
      };
    }),
    ...playlists.map(
      (playlist): PlaylistRow => ({
        key: `curated:${playlist.slug}`,
        href: `/playlist/${playlist.slug}`,
        title: playlist.title,
        cover: playlist.cover,
        count: playlist.items.length,
        totalSec: playlist.totalSec,
        items: playlist.items,
        kind: "curated",
      }),
    ),
  ];

  const byFilter = filter === "all" ? rows : rows.filter((r) => r.kind === filter);
  const q = query.trim().toLowerCase();
  const visible = q ? byFilter.filter((r) => r.title.toLowerCase().includes(q)) : byFilter;

  // The id is minted on the click rather than while rendering: it is made
  // from the clock, so rendering it would give the server and the browser
  // different answers and break hydration.
  const createPlaylist = () => router.push(`/playlist/edit?id=${newMyPlaylistId()}`);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="type-section text-ink">เพลย์ลิสต์</h1>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setSearchOpen((open) => !open);
              setQuery("");
            }}
            aria-label="ค้นหาเพลย์ลิสต์"
            aria-pressed={searchOpen}
            className={`grid size-9 place-items-center rounded-full transition-colors ${
              searchOpen ? "bg-mid text-ink" : "text-muted hover:bg-card hover:text-ink"
            }`}
          >
            <SearchIcon size={19} />
          </button>
          <button
            type="button"
            onClick={createPlaylist}
            aria-label="สร้างเพลย์ลิสต์ใหม่"
            className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-card hover:text-ink"
          >
            <PlusIcon size={19} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="input-inset mt-4 flex items-center gap-3 rounded-[500px] bg-mid px-4 py-3">
          <SearchIcon size={18} className="shrink-0 text-muted" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาเพลย์ลิสต์"
            aria-label="ค้นหาเพลย์ลิสต์"
            className="w-full bg-transparent type-caption text-ink outline-none placeholder:text-muted"
          />
        </div>
      )}

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
        {FILTERS.map(({ key, label }) => {
          if (key === "mine" && mine.length === 0) return null;
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={active}
              className={`shrink-0 rounded-full px-4 py-2 type-small-bold transition-colors ${
                active ? "bg-green text-on-green" : "bg-mid text-ink hover:bg-card"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <ul className="mt-4 space-y-0.5">
        {visible.map((row) => (
          <PlaylistRowItem
            key={row.key}
            row={row}
            live={playing && isPlayingIn(row.items, current?.slug)}
          />
        ))}

        {/*
          The create affordance closes the list rather than opening it — the
          header's "+" is for someone who already knows what they want, this
          is for someone scanning past everything that exists first and
          finding nothing to arrange has changed their mind.
        */}
        <li>
          <button
            type="button"
            onClick={createPlaylist}
            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-card-alt"
          >
            <span className="grid size-16 shrink-0 place-items-center rounded-md bg-mid text-muted">
              <PlusIcon size={24} />
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
        </li>
      </ul>
    </div>
  );
}

/**
 * One playlist, list-style: a bigger cover than a plain row so it still
 * reads at a glance, title, and a type-and-source subtitle the way an owner
 * name would sit under an album — "เสียงสวด" standing in for the owner on a
 * curated set, matching how a listener would name whoever picked it.
 *
 * The row opens the view-and-play page rather than starting playback
 * itself — pressing play is one explicit tap away there, the same distance
 * as editing, rather than a second control competing for space in the row.
 */
function PlaylistRowItem({ row, live }: { row: PlaylistRow; live: boolean }) {
  return (
    <li>
      <Link
        href={row.href}
        className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-card-alt"
      >
        <Cover
          src={row.cover}
          alt={row.title}
          sizes="64px"
          className="w-16 shrink-0"
        />
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate type-caption-bold ${live ? "text-green" : "text-ink"}`}
          >
            {row.title}
          </span>
          <span className="mt-0.5 flex items-center gap-1 truncate type-small text-muted">
            {live && <EqualizerIcon size={12} />}
            เพลย์ลิสต์ • {row.kind === "mine" ? "คุณ" : "เสียงสวด"} · {row.count} บท ·{" "}
            {formatDurationLong(row.totalSec)}
          </span>
        </span>
      </Link>
    </li>
  );
}
