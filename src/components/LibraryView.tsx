"use client";

import Link from "next/link";
import { useState } from "react";
import type { ChantWithAudio, PlaylistWithChants } from "@/lib/types";
import { formatDurationLong } from "@/lib/format";
import { Cover } from "./Cover";
import { TrackRow } from "./TrackRow";
import { EqualizerIcon, MoreIcon, PlusIcon, SettingsIcon } from "./Icons";
import { usePlayer } from "./player/PlayerProvider";

type Tab = "playlists" | "favourites" | "downloads";

const TABS: { id: Tab; label: string }[] = [
  { id: "playlists", label: "เพลย์ลิสต์" },
  { id: "favourites", label: "รายการโปรด" },
  { id: "downloads", label: "ดาวน์โหลด" },
];

/**
 * The library screen.
 *
 * Favourites and downloads are demo surfaces: favourites shows the chants that
 * have a take, downloads shows the same set as "already on this device". They
 * exist so the tab row is real to click rather than a dead control.
 */
export function LibraryView({
  playlists,
  chants,
}: {
  playlists: PlaylistWithChants[];
  chants: ChantWithAudio[];
}) {
  const [tab, setTab] = useState<Tab>("playlists");
  const { current, playing } = usePlayer();
  const withAudio = chants.filter((c) => c.audioUrl);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="type-section text-ink">ห้องสมุด</h1>
        <button
          type="button"
          aria-label="ตั้งค่า"
          className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-mid hover:text-ink"
        >
          <SettingsIcon size={20} />
        </button>
      </header>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`shrink-0 rounded-full px-4 py-2 type-small-bold transition-colors duration-150 ${
              tab === t.id
                ? "bg-green text-on-green"
                : "bg-mid text-ink hover:bg-card"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "playlists" && (
        <ul className="mt-5 space-y-1">
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-card-alt"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-md bg-mid text-muted">
                <PlusIcon size={22} />
              </span>
              <span className="type-caption-bold text-ink">สร้างเพลย์ลิสต์ใหม่</span>
            </button>
          </li>

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
                  {nowPlaying ? (
                    <EqualizerIcon size={16} />
                  ) : (
                    <MoreIcon size={18} className="shrink-0 text-muted" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {tab === "favourites" && (
        <div className="mt-5">
          <p className="mb-3 type-small text-muted">
            {withAudio.length} บทที่คุณบันทึกไว้
          </p>
          <div className="space-y-0.5">
            {withAudio.map((chant, i) => (
              <TrackRow
                key={chant.slug}
                chant={chant}
                queue={withAudio}
                position={i + 1}
              />
            ))}
          </div>
        </div>
      )}

      {tab === "downloads" && (
        <div className="mt-5">
          <p className="mb-3 type-small text-muted">
            ดาวน์โหลดแล้ว {withAudio.length} บท · ฟังได้แม้ไม่มีอินเทอร์เน็ต
          </p>
          <div className="space-y-0.5">
            {withAudio.map((chant, i) => (
              <TrackRow
                key={chant.slug}
                chant={chant}
                queue={withAudio}
                position={i + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
