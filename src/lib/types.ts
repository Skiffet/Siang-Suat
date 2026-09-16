/**
 * Data model for the chant library.
 *
 * A chant is authored as JSON in `content/chants/*.json`. The TTS pipeline
 * (`scripts/tts`) turns it into an audio file; the web player reads the same
 * JSON to render text, timings and metadata. Keeping one source of truth means
 * the eventual mobile app can consume these files unchanged.
 */

/** How a line should be voiced. Drives pacing, not just styling. */
export type SegmentKind =
  /** Pali transliterated into Thai script. Read slowly, syllable by syllable. */
  | "pali"
  /** Plain Thai narration — intros, instructions, closing words. */
  | "thai"
  /** Thai translation of the preceding Pali line. Read at a calm, normal pace. */
  | "translation"
  /** Deliberate silence. `text` is ignored. */
  | "silence";

export interface ChantSegment {
  kind: SegmentKind;
  text: string;
  /** Silence inserted after this segment, in milliseconds. */
  pauseAfterMs?: number;
  /** Speaking rate multiplier for this segment only. Overrides the kind default. */
  rate?: number;
  /**
   * Skip the Pali lexicon pass for this segment. Use when a line is already
   * spelled the way it should be pronounced.
   */
  rawPronunciation?: boolean;
}

export interface VoiceConfig {
  /** Provider-specific voice id, e.g. "th-TH-Neural2-C" or "Kore". */
  name?: string;
  /** Baseline rate for the whole chant. Segment `rate` multiplies this. */
  rate?: number;
  /** Pitch shift in semitones. Supported by Google Cloud TTS and Edge TTS. */
  pitch?: number;
  /**
   * Natural-language delivery direction. Only Gemini TTS uses this; the SSML
   * providers ignore it.
   */
  styleHint?: string;
}

export interface Chant {
  /** URL slug and audio filename stem. Must be unique. */
  slug: string;
  title: string;
  /** Romanised or Pali subtitle shown under the title. */
  subtitle?: string;
  category: ChantCategory;
  description: string;
  tags?: string[];
  /**
   * How many times the whole chant repeats, the way it is recited in practice
   * (นะโม 3 จบ). The pipeline expands this before synthesis.
   */
  repeat?: number;
  /** Silence between repeats, in milliseconds. */
  pauseBetweenRepeatsMs?: number;
  voice?: VoiceConfig;
  /**
   * Cover art stem in `public/covers`. Art carries all the colour in the
   * interface (DESIGN.md — the chrome itself is achromatic), so every chant
   * gets one.
   */
  cover: string;
  /**
   * A take recorded or synthesised outside `scripts/tts`, dropped straight
   * into `public/audio`. The manifest never sees these, so the file and its
   * length are declared here instead.
   */
  audio?: { file: string; durationSec: number };
  segments: ChantSegment[];
}

/**
 * A hand-curated shelf of chants — what the library screen lists and what the
 * player queues when you press play on a cover.
 */
export interface Playlist {
  slug: string;
  title: string;
  description: string;
  cover: string;
  /** Chant slugs, in listening order. */
  chants: string[];
}

/** A playlist with its chants resolved, plus the totals the UI prints. */
export interface PlaylistWithChants extends Playlist {
  items: ChantWithAudio[];
  totalSec: number;
}

/** One horizontal rail on the home screen. */
export interface Shelf {
  slug: string;
  title: string;
  items: ChantWithAudio[];
}

export type ChantCategory =
  | "daily"
  | "blessing"
  | "meditation"
  | "protection"
  | "funeral";

/** A chant plus everything derived from the build: audio URL, duration, timings. */
export interface ChantWithAudio extends Chant {
  audioUrl: string | null;
  /** Seconds. Null until the audio has been generated. */
  durationSec: number | null;
  /** Empty until the audio has been generated. */
  timings: SegmentTiming[];
  timingsExact: boolean;
}

/** When one line of the chant starts, so the player can highlight along. */
export interface SegmentTiming {
  /** Index into `Chant.segments`. Repeats reuse the same index. */
  sourceIndex: number;
  /** Which pass through the chant, for `repeat` > 1. Zero-based. */
  repeatIndex: number;
  startSec: number;
}

/** Written to `public/audio/manifest.json` by the TTS pipeline. */
export interface AudioManifestEntry {
  slug: string;
  file: string;
  durationSec: number;
  bytes: number;
  provider: string;
  voice: string;
  /** Hash of the synthesis input. Unchanged hash means no regeneration. */
  hash: string;
  generatedAt: string;
  /** Line start times. Exact when the provider reports them, estimated otherwise. */
  timings: SegmentTiming[];
  /** False when `timings` came from character-count estimation. */
  timingsExact: boolean;
}

export type AudioManifest = Record<string, AudioManifestEntry>;
