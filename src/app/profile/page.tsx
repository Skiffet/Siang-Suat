import type { Metadata } from "next";
import Link from "next/link";
import { LotusMark, ChevronRightIcon } from "@/components/Icons";
import { getChants, getPlaylists } from "@/lib/content";

export const metadata: Metadata = { title: "โปรไฟล์" };


export default function ProfilePage() {
  const chants = getChants();
  const playlists = getPlaylists();
  const withAudio = chants.filter((c) => c.audioUrl).length;

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      <header className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-mid text-gold">
          <LotusMark size={32} />
        </span>
        <div className="min-w-0">
          <p className="type-micro uppercase tracking-[1.4px] text-muted">โปรไฟล์</p>
          <h1 className="type-section text-ink">ผู้ฟังเสียงสวด</h1>
          <p className="mt-1 type-small text-muted">
            {playlists.length} เพลย์ลิสต์ · {chants.length} บทในห้องสมุด
          </p>
        </div>
      </header>

      <section className="mt-7 grid grid-cols-3 gap-2">
        {[
          { label: "บทที่ฟังได้แล้ว", value: String(withAudio) },
          { label: "บทในคลัง", value: String(chants.length) },
          { label: "เพลย์ลิสต์", value: String(playlists.length) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-surface p-4">
            <p className="type-section text-ink">{stat.value}</p>
            <p className="mt-1 type-small text-muted">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="type-feature text-ink">เพลย์ลิสต์ที่จัดไว้ให้</h2>
        <ul className="mt-3 space-y-0.5">
          {playlists.map((playlist) => (
            <li key={playlist.slug}>
              <Link
                href={`/playlist/${playlist.slug}`}
                className="flex items-center justify-between gap-3 rounded-md px-3 py-3 transition-colors hover:bg-card-alt"
              >
                <span className="min-w-0">
                  <span className="block truncate type-caption-bold text-ink">
                    {playlist.title}
                  </span>
                  <span className="block truncate type-small text-muted">
                    {playlist.items.length} ตอน
                  </span>
                </span>
                <ChevronRightIcon size={14} className="shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}
