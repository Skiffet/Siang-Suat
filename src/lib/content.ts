import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CATEGORY_ORDER } from "./categories";
import type {
  AudioManifest,
  Chant,
  ChantCategory,
  ChantWithAudio,
  Playlist,
  PlaylistEntry,
  PlaylistWithChants,
  QueuedChant,
  Shelf,
} from "./types";

const CONTENT_DIR = join(process.cwd(), "content");
const CHANTS_DIR = join(CONTENT_DIR, "chants");
const PLAYLISTS_DIR = join(CONTENT_DIR, "playlists");
const MANIFEST_PATH = join(process.cwd(), "public", "audio", "manifest.json");

/** The chant a sitting opens with, when a playlist entry asks for it. */
const NAMO_SLUG = "namo-tassa";

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
      // Aligned from the audio itself rather than reported by a provider, so
      // accurate to the pause before each line rather than to the syllable.
      timings: chant.audio?.timings ?? [],
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

/** A sitting can say how a chant is treated; otherwise the chant's own default stands. */
function resolveEntry(
  entry: PlaylistEntry,
  bySlug: Map<string, ChantWithAudio>,
): { chant: QueuedChant; namo: boolean } | null {
  const spec = typeof entry === "string" ? { slug: entry } : entry;
  const chant = bySlug.get(spec.slug);
  if (!chant) return null;
  return {
    chant: { ...chant, rounds: spec.rounds ?? chant.defaultRounds ?? 1 },
    namo: typeof entry === "string" ? false : Boolean(entry.namo),
  };
}

export function getPlaylists(): PlaylistWithChants[] {
  const chants = getChants();
  const bySlug = new Map(chants.map((c) => [c.slug, c]));

  return readJsonDir<Playlist>(PLAYLISTS_DIR).map((playlist) => {
    const items: QueuedChant[] = [];
    for (const entry of playlist.chants) {
      const resolved = resolveEntry(entry, bySlug);
      if (!resolved) continue;
      // นะโม opens the sitting, so it goes into the queue ahead of the chant
      // that asked for it rather than being part of that chant.
      if (resolved.namo) {
        const namo = bySlug.get(NAMO_SLUG);
        if (namo && !items.some((i) => i.slug === NAMO_SLUG)) {
          items.push({ ...namo, rounds: namo.defaultRounds ?? 1 });
        }
      }
      items.push(resolved.chant);
    }
    return {
      ...playlist,
      items,
      totalSec: items.reduce((sum, c) => sum + (c.durationSec ?? 0) * c.rounds, 0),
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
