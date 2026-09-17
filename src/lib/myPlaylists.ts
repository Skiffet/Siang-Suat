"use client";

import type { ChantWithAudio, PlaylistEntry, QueuedChant } from "./types";

/**
 * Playlists the listener made themselves.
 *
 * The same idea as the ones in `content/playlists`, which are shortcuts we
 * arranged for them; these are the ones they arranged. There is no account
 * and no server, so they live in the browser — one device, one browser, and
 * gone with the site data. Fine for arranging your own morning chanting, not
 * a place to keep anything you would be sorry to lose.
 */
export interface MyPlaylist {
  id: string;
  title: string;
  /** Cover stem, borrowed from the first chant so the row is never blank. */
  cover: string;
  entries: PlaylistEntry[];
  updatedAt: string;
}

const KEY = "siang-suad.my-playlists.v1";

/**
 * Everyone reading this list — the sidebar, the playlists screen, anything
 * added later — has to see a save or delete immediately, including ones made
 * by a different mounted component than the one doing the reading. A layout
 * component like the sidebar mounts once and never remounts on navigation, so
 * a one-shot read at mount would go stale the moment a playlist changes
 * anywhere else in the app. `useSyncExternalStore` is the correct tool for
 * exactly this, so this module exposes the subscribe/snapshot pair it needs
 * rather than leaving each caller to invent its own polling or refetch timing.
 */
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

/** Storage throws in private windows and when site data is blocked. */
function read(): MyPlaylist[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MyPlaylist[]) : [];
  } catch {
    return [];
  }
}

/**
 * `getSnapshot` has to return the *same* reference across calls when nothing
 * changed, or `useSyncExternalStore` sees a new array every render (a JSON
 * parse always allocates one) and concludes the store never settles — React
 * throws "Maximum update depth exceeded" rather than silently degrading.
 * Caching on the raw string is cheap and exactly as fresh as localStorage
 * itself: any write, from this tab or another, changes the string first.
 */
let cachedRaw: string | null | undefined;
let cachedSnapshot: MyPlaylist[] = [];

function write(list: MyPlaylist[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    notify();
    return true;
  } catch {
    return false;
  }
}

const EMPTY: MyPlaylist[] = [];

/** For `useSyncExternalStore`'s subscribe argument. */
export function subscribeMyPlaylists(onChange: () => void): () => void {
  listeners.add(onChange);
  // A write from another tab reaches this one as a native `storage` event
  // rather than through the in-memory listener set above.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** For `useSyncExternalStore`'s getServerSnapshot argument. */
export function getMyPlaylistsServerSnapshot(): MyPlaylist[] {
  return EMPTY;
}

export function loadMyPlaylists(): MyPlaylist[] {
  return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** For `useSyncExternalStore`'s getSnapshot argument — see the cache note above. */
export function getMyPlaylistsSnapshot(): MyPlaylist[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = loadMyPlaylists();
  }
  return cachedSnapshot;
}

export function getMyPlaylist(id: string): MyPlaylist | undefined {
  return read().find((s) => s.id === id);
}

export function saveMyPlaylist(sitting: Omit<MyPlaylist, "updatedAt">): boolean {
  const list = read();
  const at = list.findIndex((s) => s.id === sitting.id);
  const next = { ...sitting, updatedAt: new Date().toISOString() };
  if (at >= 0) list[at] = next;
  else list.push(next);
  return write(list);
}

export function deleteMyPlaylist(id: string): boolean {
  return write(read().filter((s) => s.id !== id));
}

export function newMyPlaylistId(): string {
  return `s${Date.now().toString(36)}`;
}

/**
 * Resolve one saved playlist into a queue, the same way a content-authored
 * one is resolved server-side: applying each entry's count and expanding the
 * opening นะโม flag. Shared by the playlists screen and the sidebar so the
 * two cannot drift on what a saved playlist actually contains.
 */
export function resolveMyPlaylist(
  saved: MyPlaylist,
  bySlug: Map<string, ChantWithAudio>,
): QueuedChant[] {
  // If นะโม ตัสสะ is already one of the playlist's own entries, it will be
  // pushed when the loop reaches it — auto-inserting it earlier too would
  // duplicate the slug and break React's keys on the track list.
  const hasOwnNamoEntry = saved.entries.some(
    (entry) => (typeof entry === "string" ? entry : entry.slug) === "namo-tassa",
  );
  const out: QueuedChant[] = [];
  for (const entry of saved.entries) {
    const spec = typeof entry === "string" ? { slug: entry } : entry;
    const chant = bySlug.get(spec.slug);
    if (!chant) continue;
    if (typeof entry !== "string" && entry.namo && !hasOwnNamoEntry) {
      const namo = bySlug.get("namo-tassa");
      if (namo && !out.some((c) => c.slug === "namo-tassa")) {
        out.push({ ...namo, rounds: namo.defaultRounds ?? 1 });
      }
    }
    out.push({ ...chant, rounds: spec.rounds ?? chant.defaultRounds ?? 1 });
  }
  return out;
}
