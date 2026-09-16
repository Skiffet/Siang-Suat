"use client";

/**
 * Is the chant currently playing part of this list?
 *
 * A chant in parts plays under a slug like `maha-chakkraphat#1`, so simple
 * membership (`items.includes(currentSlug)`) misses it while its opening or
 * closing plays. Checked here once so every "is this playlist the one
 * playing" indicator — the sidebar, the home quick-pick tiles, a playlist's
 * own page — agrees with the others.
 */
export function isPlayingIn(
  items: { slug: string }[],
  currentSlug: string | null | undefined,
): boolean {
  if (!currentSlug) return false;
  return items.some(
    (c) => c.slug === currentSlug || currentSlug.startsWith(`${c.slug}#`),
  );
}
