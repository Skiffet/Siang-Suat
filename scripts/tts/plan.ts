import { createHash } from "node:crypto";
import type { Chant, SegmentKind } from "../../src/lib/types";
import { applyLexicon, type Lexicon } from "./lexicon";

/**
 * One line as the synthesiser will speak it, after repeats are expanded and
 * the lexicon has been applied.
 */
export interface PlannedSegment {
  /** Index into the ORIGINAL chant segments, so the player can map audio back
   *  to the text on screen even when repeats duplicated the line. */
  sourceIndex: number;
  /** Which pass through the chant this is, for `repeat` > 1. Zero-based. */
  repeatIndex: number;
  kind: SegmentKind;
  /** What the reader sees. */
  displayText: string;
  /** What the synthesiser is given. Differs from displayText for Pali lines. */
  spokenText: string;
  pauseAfterMs: number;
  rate: number;
}

export interface SpeechPlan {
  slug: string;
  segments: PlannedSegment[];
  voiceName?: string;
  pitch: number;
  styleHint?: string;
}

/**
 * Default pace per line type. Pali is slowest because it is chanted, not read;
 * the Thai translation sits just under conversational speed so the two are
 * clearly distinct to the ear.
 */
const RATE_BY_KIND: Record<SegmentKind, number> = {
  pali: 0.82,
  thai: 1.0,
  translation: 0.95,
  silence: 1.0,
};

export function buildPlan(chant: Chant, lexicon: Lexicon): SpeechPlan {
  const baseRate = chant.voice?.rate ?? 1;
  const repeats = Math.max(1, chant.repeat ?? 1);
  const betweenRepeats = chant.pauseBetweenRepeatsMs ?? 1500;
  const segments: PlannedSegment[] = [];

  for (let pass = 0; pass < repeats; pass++) {
    chant.segments.forEach((seg, sourceIndex) => {
      const isLastOfPass = sourceIndex === chant.segments.length - 1;
      const isLastPass = pass === repeats - 1;

      // Between passes the repeat gap replaces the line's own trailing pause,
      // rather than stacking on top of it.
      const pauseAfterMs =
        isLastOfPass && !isLastPass
          ? betweenRepeats
          : (seg.pauseAfterMs ?? defaultPause(seg.kind));

      const spokenText =
        seg.kind === "pali" && !seg.rawPronunciation
          ? applyLexicon(seg.text, lexicon)
          : seg.text;

      segments.push({
        sourceIndex,
        repeatIndex: pass,
        kind: seg.kind,
        displayText: seg.text,
        spokenText,
        pauseAfterMs,
        rate: baseRate * (seg.rate ?? RATE_BY_KIND[seg.kind]),
      });
    });
  }

  return {
    slug: chant.slug,
    segments,
    voiceName: chant.voice?.name,
    pitch: chant.voice?.pitch ?? 0,
    styleHint: chant.voice?.styleHint,
  };
}

function defaultPause(kind: SegmentKind): number {
  return kind === "pali" ? 600 : 400;
}

/** Stable fingerprint of everything that affects the audio. Unchanged means no
 *  need to spend another synthesis call. */
export function planFingerprint(plan: SpeechPlan, provider: string): string {
  const payload = JSON.stringify({
    provider,
    voiceName: plan.voiceName,
    pitch: plan.pitch,
    styleHint: plan.styleHint,
    segments: plan.segments.map((s) => [s.spokenText, s.pauseAfterMs, s.rate]),
  });
  // A cache key, not a security boundary — a short digest is plenty.
  return createHash("sha256")
    .update(payload)
    .digest("hex")
    .slice(0, 16);
}
