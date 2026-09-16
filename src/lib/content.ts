import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CATEGORY_ORDER } from "./categories";
import type {
  AudioManifest,
  Chant,
  ChantCategory,
  ChantWithAudio,
  Playlist,
  PlaylistWithChants,
  Shelf,
} from "./types";

const CONTENT_DIR = join(process.cwd(), "content");
const CHANTS_DIR = join(CONTENT_DIR, "chants");
const PLAYLISTS_DIR = join(CONTENT_DIR, "playlists");
const MANIFEST_PATH = join(process.cwd(), "public", "audio", "manifest.json");

// Re-exported so server callers have one import for content and its labels.
export { CATEGORY_LABELS, CATEGORY_ORDER } from "./categories";

function readManifest(): AudioManifest {
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as AudioManifest;
  } catch {
    // A half-written manifest should degrade to "no audio yet", not crash the build.
    return {};
  }
}

function readJsonDir<T>(dir: string): T[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as T);
}

export function loadChants(): Chant[] {
  return readJsonDir<Chant>(CHANTS_DIR).sort((a, b) => {
    const byCategory =
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    return byCategory !== 0 ? byCategory : a.title.localeCompare(b.title, "th");
  });
}

export function getChants(): ChantWithAudio[] {
  const manifest = readManifest();
  return loadChants().map((chant) => {
    const entry = manifest[chant.slug];
    // The pipeline's own output wins; `chant.audio` covers takes made elsewhere.
    if (entry) {
      return {
        ...chant,
        audioUrl: `/audio/${entry.file}`,
        durationSec: entry.durationSec,
        timings: entry.timings,
        timingsExact: entry.timingsExact,
      };
    }
    return {
      ...chant,
      audioUrl: chant.audio ? `/audio/${chant.audio.file}` : null,
      durationSec: chant.audio?.durationSec ?? null,
      timings: [],
      timingsExact: false,
    };
  });
}

export function getChant(slug: string): ChantWithAudio | undefined {
  return getChants().find((c) => c.slug === slug);
}

/** Categories that actually have chants, so the UI never shows an empty chip. */
export function getUsedCategories(chants: ChantWithAudio[]): ChantCategory[] {
  const used = new Set(chants.map((c) => c.category));
  return CATEGORY_ORDER.filter((c) => used.has(c));
}

export function getPlaylists(): PlaylistWithChants[] {
  const chants = getChants();
  const bySlug = new Map(chants.map((c) => [c.slug, c]));
  return readJsonDir<Playlist>(PLAYLISTS_DIR).map((playlist) => {
    const items = playlist.chants
      .map((slug) => bySlug.get(slug))
      .filter((c): c is ChantWithAudio => Boolean(c));
    return {
      ...playlist,
      items,
      totalSec: items.reduce((sum, c) => sum + (c.durationSec ?? 0), 0),
    };
  });
}

export function getPlaylist(slug: string): PlaylistWithChants | undefined {
  return getPlaylists().find((p) => p.slug === slug);
}

/**
 * The home screen's rails.
 *
 * Playable chants sort ahead of silent ones inside every rail — a demo should
 * never open on a row where the first cover does nothing.
 */
export function getShelves(): Shelf[] {
  const chants = getChants();
  const playable = (list: ChantWithAudio[]) =>
    [...list].sort(
      (a, b) => Number(Boolean(b.audioUrl)) - Number(Boolean(a.audioUrl)),
    );
  const tagged = (tag: string) => playable(chants.filter((c) => c.tags?.includes(tag)));

  return [
    { slug: "popular", title: "บทสวดยอดนิยม", items: playable(chants).slice(0, 8) },
    { slug: "bedtime", title: "ฟังก่อนนอน", items: tagged("ก่อนนอน") },
    { slug: "today", title: "สำหรับวันนี้", items: tagged("ทุกวัน") },
    { slug: "meditation", title: "นั่งสมาธิ", items: playable(chants.filter((c) => c.category === "meditation")) },
  ].filter((shelf) => shelf.items.length > 0);
}
