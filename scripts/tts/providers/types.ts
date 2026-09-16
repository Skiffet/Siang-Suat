import type { SpeechPlan } from "../plan";

export interface SynthesisResult {
  audio: Buffer;
  ext: "mp3" | "wav";
  /**
   * Start time in seconds of each planned segment, aligned to
   * `SpeechPlan.segments`. Null when the provider cannot report timings — the
   * caller then estimates them.
   */
  segmentStarts: number[] | null;
  /** Human-readable voice id, recorded in the manifest. */
  voiceLabel: string;
}

export interface TtsProvider {
  id: string;
  /** Shown in the CLI when credentials are missing. */
  credentialHint: string;
  isConfigured(): boolean;
  synthesize(plan: SpeechPlan): Promise<SynthesisResult>;
}

/** Escape text before it goes inside an SSML document. */
export function escapeSsml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Spread a known total duration across segments when the provider reports no
 * timings. Speech time is apportioned by character count and the authored
 * pauses are honoured exactly, which tracks the real audio closely enough for
 * follow-along highlighting.
 */
export function estimateSegmentStarts(
  plan: SpeechPlan,
  totalSec: number,
): number[] {
  const pauseTotal = plan.segments.reduce(
    (sum, s) => sum + s.pauseAfterMs / 1000,
    0,
  );
  const charTotal = plan.segments.reduce(
    (sum, s) => sum + s.spokenText.length,
    0,
  );
  const speechTotal = Math.max(0, totalSec - pauseTotal);

  const starts: number[] = [];
  let cursor = 0;
  for (const seg of plan.segments) {
    starts.push(cursor);
    const share = charTotal > 0 ? seg.spokenText.length / charTotal : 0;
    cursor += speechTotal * share + seg.pauseAfterMs / 1000;
  }
  return starts;
}
