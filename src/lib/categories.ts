import type { ChantCategory } from "./types";

/**
 * Category labels and their order.
 *
 * Split out of `content.ts` on purpose: that module reads the filesystem, so
 * importing it from a Client Component would drag `node:fs` into the browser
 * bundle. These two constants are all the client actually needs.
 */
export const CATEGORY_LABELS: Record<ChantCategory, string> = {
  daily: "ทุกวัน",
  blessing: "มงคล",
  meditation: "สมาธิ",
  protection: "คุ้มครอง",
  funeral: "งานบำเพ็ญกุศล",
};

/** Not alphabetical — ordered by how often each category is actually used. */
export const CATEGORY_ORDER: ChantCategory[] = [
  "daily",
  "blessing",
  "meditation",
  "protection",
  "funeral",
];
