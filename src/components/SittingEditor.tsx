"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { ChantWithAudio, PlaylistEntry } from "@/lib/types";
import { formatDurationLong } from "@/lib/format";
import {
  deleteSitting,
  getSitting,
  newSittingId,
  saveSitting,
} from "@/lib/sittings";
import { Cover } from "./Cover";
import { ROUND_OPTIONS } from "./player/RoundsPicker";
import { CheckIcon, ChevronDownIcon, PlusIcon, SearchIcon } from "./Icons";

/** What an entry looks like while it is being edited — never a bare slug. */
interface Row {
  slug: string;
  rounds: number;
}

/**
 * Arrange a sitting: which chants, in what order, and how many times each.
 *
 * The counts are the point. A คาถา is kept at nine or at three depending on
 * who is chanting and how much time they have, so the number belongs to the
 * sitting rather than to the chant — and to the person arranging it, not to
 * whoever wrote the content files.
 */
const neverChanges = () => () => {};

/**
 * A saved sitting can only be read in the browser, and seeding editable state
 * from an effect would render once empty and then again full. Gating on the
 * client lets the editor below seed itself as it mounts instead, so it is
 * correct on its first paint.
 */
export function SittingEditor(props: { id: string; chants: ChantWithAudio[] }) {
  const onClient = useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );
  if (!onClient) return null;
  return <Editor {...props} />;
}

function Editor({ id, chants }: { id: string; chants: ChantWithAudio[] }) {
  const router = useRouter();
  const bySlug = useMemo(() => new Map(chants.map((c) => [c.slug, c])), [chants]);

  const saved = useMemo(() => getSitting(id), [id]);
  const [title, setTitle] = useState(saved?.title ?? "");
  const [namo, setNamo] = useState(
    saved?.entries.some((e) => typeof e !== "string" && e.namo === true) ?? false,
  );
  const [rows, setRows] = useState<Row[]>(() =>
    (saved?.entries ?? []).map((e) =>
      typeof e === "string"
        ? { slug: e, rounds: bySlug.get(e)?.defaultRounds ?? 1 }
        : {
            slug: e.slug,
            rounds: e.rounds ?? bySlug.get(e.slug)?.defaultRounds ?? 1,
          },
    ),
  );
  const [query, setQuery] = useState("");
  const [failed, setFailed] = useState(false);

  const picked = new Set(rows.map((r) => r.slug));
  const available = chants.filter((c) => {
    if (picked.has(c.slug)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [c.title, c.subtitle, ...(c.tags ?? [])]
      .filter(Boolean)
      .some((f) => f!.toLowerCase().includes(q));
  });

  const totalSec = rows.reduce(
    (n, r) => n + (bySlug.get(r.slug)?.durationSec ?? 0) * r.rounds,
    0,
  );

  function move(at: number, by: number) {
    setRows((rs) => {
      const to = at + by;
      if (to < 0 || to >= rs.length) return rs;
      const next = [...rs];
      [next[at], next[to]] = [next[to], next[at]];
      return next;
    });
  }

  function save() {
    const entries: PlaylistEntry[] = rows.map((r, i) => ({
      slug: r.slug,
      rounds: r.rounds,
      // นะโม opens the sitting, so it rides on the first entry.
      ...(namo && i === 0 ? { namo: true } : {}),
    }));
    const ok = saveSitting({
      id,
      title: title.trim() || "การสวดของฉัน",
      cover: bySlug.get(rows[0]?.slug)?.cover ?? "temple-sunrise",
      entries,
    });
    if (!ok) {
      setFailed(true);
      return;
    }
    router.push("/library");
  }

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      <h1 className="type-section text-ink">จัดการสวดของคุณ</h1>
      <p className="mt-1 type-caption text-muted">
        เลือกบท เรียงลำดับ แล้วกำหนดว่าจะสวดบทละกี่จบ
      </p>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="ตั้งชื่อ เช่น สวดเช้าของฉัน"
        aria-label="ชื่อการสวด"
        className="input-inset mt-5 w-full rounded-[500px] bg-mid px-5 py-3 type-caption text-ink outline-none transition-shadow placeholder:text-muted"
      />

      <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl bg-surface px-4 py-3">
        <span
          className={`grid size-6 shrink-0 place-items-center rounded-md transition-colors ${
            namo ? "bg-green text-on-green" : "border border-line-light text-transparent"
          }`}
        >
          <CheckIcon size={14} />
        </span>
        <input
          type="checkbox"
          checked={namo}
          onChange={(e) => setNamo(e.target.checked)}
          className="sr-only"
        />
        <span className="min-w-0">
          <span className="block type-caption text-ink">ขึ้นต้นด้วยนะโม 3 จบ</span>
          <span className="block type-small text-muted">
            สวดครั้งเดียวตอนเริ่ม ไม่ใช่ก่อนทุกบท
          </span>
        </span>
      </label>

      {/* The sitting so far */}
      <section className="mt-7">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="type-feature text-ink">ลำดับการสวด</h2>
          {rows.length > 0 && (
            <span className="type-small text-muted">
              {rows.length} บท · {formatDurationLong(totalSec)}
            </span>
          )}
        </div>

        {rows.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-line px-4 py-8 text-center type-caption text-muted">
            ยังไม่ได้เลือกบท — เลือกจากรายการด้านล่าง
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {rows.map((row, i) => {
              const chant = bySlug.get(row.slug);
              if (!chant) return null;
              return (
                <li
                  key={row.slug}
                  className="flex items-center gap-3 rounded-xl bg-surface p-3"
                >
                  <span className="w-5 shrink-0 text-center type-caption text-muted">
                    {i + 1}
                  </span>
                  <Cover
                    src={chant.cover}
                    alt={chant.title}
                    sizes="44px"
                    className="w-11 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate type-caption-bold text-ink">
                      {chant.title}
                    </span>
                    <span className="block truncate type-small text-muted">
                      {chant.durationSec
                        ? formatDurationLong(chant.durationSec * row.rounds)
                        : "ยังไม่มีเสียง"}
                    </span>
                  </span>

                  <label className="shrink-0">
                    <span className="sr-only">จำนวนจบของ {chant.title}</span>
                    <select
                      value={row.rounds}
                      onChange={(e) =>
                        setRows((rs) =>
                          rs.map((r, j) =>
                            j === i ? { ...r, rounds: Number(e.target.value) } : r,
                          ),
                        )
                      }
                      className="rounded-full bg-mid px-3 py-1.5 type-small-bold text-ink outline-none"
                    >
                      {ROUND_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n === 1 ? "จบเดียว" : `${n} จบ`}
                        </option>
                      ))}
                    </select>
                  </label>

                  <span className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label={`เลื่อน ${chant.title} ขึ้น`}
                      className="text-muted transition-colors hover:text-ink disabled:opacity-25"
                    >
                      <ChevronDownIcon size={16} className="rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === rows.length - 1}
                      aria-label={`เลื่อน ${chant.title} ลง`}
                      className="text-muted transition-colors hover:text-ink disabled:opacity-25"
                    >
                      <ChevronDownIcon size={16} />
                    </button>
                  </span>

                  <button
                    type="button"
                    onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                    aria-label={`เอา ${chant.title} ออก`}
                    className="shrink-0 text-muted transition-colors hover:text-ink"
                  >
                    <PlusIcon size={18} className="rotate-45" />
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Everything not in it yet */}
      <section className="mt-7">
        <h2 className="type-feature text-ink">เพิ่มบทสวด</h2>
        <div className="input-inset mt-3 flex items-center gap-3 rounded-[500px] bg-mid px-4 py-2.5 transition-shadow">
          <SearchIcon size={16} className="shrink-0 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาบทสวด"
            aria-label="ค้นหาบทสวดเพื่อเพิ่ม"
            className="w-full bg-transparent type-caption text-ink outline-none placeholder:text-muted"
          />
        </div>

        <ul className="mt-3 space-y-0.5">
          {available.map((chant) => (
            <li key={chant.slug}>
              <button
                type="button"
                onClick={() =>
                  setRows((rs) => [
                    ...rs,
                    { slug: chant.slug, rounds: chant.defaultRounds ?? 1 },
                  ])
                }
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-card-alt"
              >
                <Cover
                  src={chant.cover}
                  alt={chant.title}
                  sizes="40px"
                  className="w-10 shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate type-caption text-ink">
                    {chant.title}
                  </span>
                  <span className="block truncate type-small text-muted">
                    {chant.durationSec
                      ? formatDurationLong(chant.durationSec)
                      : "ยังไม่มีเสียง"}
                  </span>
                </span>
                <PlusIcon size={18} className="shrink-0 text-muted" />
              </button>
            </li>
          ))}
          {available.length === 0 && (
            <p className="py-6 text-center type-caption text-muted">
              เพิ่มครบทุกบทแล้ว
            </p>
          )}
        </ul>
      </section>

      {failed && (
        <p className="mt-6 rounded-xl border border-line px-4 py-3 type-small text-muted">
          บันทึกไม่ได้ — เบราว์เซอร์นี้ไม่ให้เก็บข้อมูลของเว็บ
          (โหมดส่วนตัวหรือปิดการเก็บไว้)
        </p>
      )}

      <div className="mt-7 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={rows.length === 0}
          className="rounded-full bg-green px-6 py-3 type-button text-on-green transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
        >
          บันทึก
        </button>
        {saved && (
          <button
            type="button"
            onClick={() => {
              deleteSitting(id);
              router.push("/library");
            }}
            className="rounded-full px-4 py-3 type-small-bold text-muted transition-colors hover:text-ink"
          >
            ลบทิ้ง
          </button>
        )}
      </div>
    </div>
  );
}

export { newSittingId };
