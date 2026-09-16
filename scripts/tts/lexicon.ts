import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Thai TTS voices mispronounce transliterated Pali — they apply Thai reading
 * rules to syllables that do not follow them. The lexicon rewrites those words
 * into a spelling the voice reads correctly.
 *
 * Separating syllables with a space is what forces the reading; Thai TTS
 * tokenisers treat the space as a word boundary, which also gives the
 * syllable-by-syllable cadence chanting wants.
 */
const LEXICON_PATH = join(process.cwd(), "content", "lexicon", "pali.json");

export type Lexicon = Map<string, string>;

export function loadLexicon(): Lexicon {
  const raw = JSON.parse(readFileSync(LEXICON_PATH, "utf8")) as Record<
    string,
    unknown
  >;
  const entries = Object.entries(raw)
    // `_readme` and any other note key are documentation, not pronunciation.
    .filter(([k, v]) => !k.startsWith("_") && typeof v === "string")
    .map(([k, v]) => [k, v as string] as const);

  // Longest first, so "สัมมาสัมพุทธัสสะ" wins over a shorter substring entry.
  entries.sort((a, b) => b[0].length - a[0].length);
  return new Map(entries);
}

/**
 * Apply the lexicon to one line. Thai has no spaces between words, so this
 * scans for the longest matching entry at each position rather than splitting.
 */
export function applyLexicon(text: string, lexicon: Lexicon): string {
  const keys = [...lexicon.keys()];
  let out = "";
  let i = 0;

  outer: while (i < text.length) {
    for (const key of keys) {
      if (text.startsWith(key, i)) {
        const replacement = lexicon.get(key)!;
        // Keep the words apart so a replacement never fuses with its neighbour.
        if (out.length > 0 && !out.endsWith(" ")) out += " ";
        out += replacement + " ";
        i += key.length;
        continue outer;
      }
    }
    out += text[i];
    i += 1;
  }

  return out.replace(/\s+/g, " ").trim();
}

/** Words in the text that the lexicon has no entry for. Used by `--check`. */
export function findUncoveredWords(text: string, lexicon: Lexicon): string[] {
  const covered = [...lexicon.keys()];
  return text
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .filter((w) => !covered.some((k) => w.includes(k)));
}
