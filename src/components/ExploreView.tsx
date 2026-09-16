"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ChantCategory, ChantWithAudio, PlaylistWithChants } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/categories";
import { Cover } from "./Cover";
import { TrackRow } from "./TrackRow";
import { SearchIcon } from "./Icons";

/**
 * Search and browse.
 *
 * Filtering runs client-side over the whole catalogue — a dozen chants is far
 * too little to justify a round trip, and typing stays instant.
 */
export function ExploreView({
  chants,
  playlists,
  categories,
}: {
  chants: ChantWithAudio[];
  playlists: PlaylistWithChants[];
  categories: ChantCategory[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ChantCategory | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chants.filter((chant) => {
      if (category && chant.category !== category) return false;
      if (!q) return true;
      // Tags matter as much as the title here — people search "ก่อนนอน", not a title.
      return [chant.title, chant.subtitle, chant.description, ...(chant.tags ?? [])]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q));
    });
  }, [chants, query, category]);

  const browsing = !query.trim() && !category;

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      <h1 className="type-section text-ink">สำรวจ</h1>

      <div className="input-inset mt-4 flex items-center gap-3 rounded-[500px] bg-mid px-4 py-3 transition-shadow">
        <SearchIcon size={18} className="shrink-0 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาบทสวด ธรรมะ หรือหัวข้อที่สนใจ"
          aria-label="ค้นหา"
          className="w-full bg-transparent type-caption text-ink outline-none placeholder:text-muted"
        />
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setCategory(null)}
          aria-pressed={category === null}
          className={`shrink-0 rounded-full px-4 py-2 type-small-bold transition-colors ${
            category === null ? "bg-green text-on-green" : "bg-mid text-ink hover:bg-card"
          }`}
        >
          ทั้งหมด
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(category === c ? null : c)}
            aria-pressed={category === c}
            className={`shrink-0 rounded-full px-4 py-2 type-small-bold transition-colors ${
              category === c ? "bg-green text-on-green" : "bg-mid text-ink hover:bg-card"
            }`}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {browsing && (
        <section className="mt-7">
          <h2 className="type-feature text-ink">หมวดหมู่</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {playlists.map((playlist) => (
              <Link
                key={playlist.slug}
                href={`/playlist/${playlist.slug}`}
                className="group relative overflow-hidden rounded-lg"
              >
                <Cover
                  src={playlist.cover}
                  alt={playlist.title}
                  sizes="(min-width: 1024px) 220px, 45vw"
                  rounded="rounded-lg"
                  className="transition-transform duration-300 group-hover:scale-105"
                />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <span className="absolute inset-x-3 bottom-3">
                  <span className="block type-caption-bold text-ink">
                    {playlist.title}
                  </span>
                  <span className="block type-small text-near-white">
                    {playlist.items.length} ตอน
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-7">
        <h2 className="type-feature text-ink">
          {browsing ? "บทสวดทั้งหมด" : `พบ ${results.length} รายการ`}
        </h2>
        <div className="mt-3 space-y-0.5">
          {results.map((chant, i) => (
            <TrackRow
              key={chant.slug}
              chant={chant}
              queue={results}
              position={i + 1}
            />
          ))}
          {results.length === 0 && (
            <p className="py-8 text-center type-caption text-muted">
              ไม่พบบทสวดที่ตรงกับ “{query}”
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
