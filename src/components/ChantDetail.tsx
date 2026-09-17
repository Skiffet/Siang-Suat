"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import type { ChantWithAudio } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/categories";
import { formatDurationLong } from "@/lib/format";
import { Cover } from "./Cover";
import { usePlayer } from "./player/PlayerProvider";
import { AddToPlaylistButton } from "./AddToPlaylistButton";
import { PlayButton } from "./PlayButton";
import { Rail } from "./Rail";
import { Transcript } from "./Transcript";

/**
 * A chant's own page: the art, the controls, and the text.
 *
 * The header gradient is tinted by nothing but the art sitting on top of it —
 * the surfaces underneath stay achromatic, as the system requires.
 */
export function ChantDetail({
  chant,
  related,
}: {
  chant: ChantWithAudio;
  related: ChantWithAudio[];
}) {
  const tags = useMemo(() => chant.tags ?? [], [chant.tags]);
  // While this chant is playing the count may have been changed, and the page
  // should say what is actually set rather than what the file was authored
  // with.
  const { rounds: liveRounds, isCurrent, current } = usePlayer();
  const playing = isCurrent(chant.slug);

  /**
   * Follow the queue to whatever plays next.
   *
   * This page is read while chanting — hands are together, not on the mouse
   * — so once a playlist moves on to the next chant, the page has to move
   * with it rather than wait to be clicked through. It only follows a
   * transition that happened while this chant was actually the one playing
   * here; opening a chant's page while something else already plays in the
   * background must not immediately bounce you to that other page.
   */
  const router = useRouter();
  const wasPlayingHereRef = useRef(false);
  useEffect(() => {
    const nextSlug = current ? (current.parentSlug ?? current.slug) : null;
    if (nextSlug === chant.slug) {
      wasPlayingHereRef.current = true;
      return;
    }
    if (wasPlayingHereRef.current && nextSlug) {
      // replace, not push — the back button should leave the reading view in
      // one step rather than stepping backward through every track a
      // playlist happened to auto-advance through.
      router.replace(`/chant/${nextSlug}`);
    }
  }, [current, chant.slug, router]);

  return (
    <article>
      <header className="relative px-4 pb-6 pt-[calc(24px+env(safe-area-inset-top))] lg:px-8 lg:pt-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-25 blur-3xl"
          style={{
            backgroundImage: `url(/covers/${chant.cover}.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
          <Cover
            src={chant.cover}
            alt={chant.title}
            sizes="(min-width: 640px) 220px, 55vw"
            preload
            className="w-40 shrink-0 self-center shadow-[var(--shadow-dialog)] sm:w-[220px] sm:self-auto"
          />

          <div className="min-w-0 flex-1">
            <p className="type-micro uppercase tracking-[1.4px] text-muted">
              บทสวด · {CATEGORY_LABELS[chant.category]}
            </p>
            <h1 className="mt-2 type-section text-ink sm:text-[40px] sm:leading-tight">
              {chant.title}
            </h1>
            {chant.subtitle && (
              <p className="mt-2 type-pali text-near-white">{chant.subtitle}</p>
            )}
            <p className="mt-3 type-small text-muted">
              เสียงสวด Podcast · {formatDurationLong(chant.durationSec)}
              {chant.audioUrl ? "" : " · ยังไม่มีไฟล์เสียง"}
            </p>
          </div>
        </div>

        <div className="relative mt-6 flex items-center gap-4">
          {/*
           * Without a queue, playback stops dead the moment this one chant
           * ends — the related rail below is the only other thing already on
           * this page, so it doubles as where listening continues to rather
           * than leaving the audio to just stop.
           */}
          <PlayButton chant={chant} queue={[chant, ...related]} size={56} />
          <AddToPlaylistButton chant={chant} size={40} />
        </div>
      </header>

      <div className="px-4 lg:px-8">
        <p className="max-w-[68ch] type-caption text-muted">{chant.description}</p>

        {tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-mid px-2 py-[2px] text-[10.5px] font-semibold capitalize leading-[1.33] text-ink"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        {chant.queue.length > 0 ? (
          /*
           * A chant in parts shows each part under its own heading, because
           * the shape is the point: you can see that the middle stanza is the
           * one held for rounds, and how many.
           */
          <div className="mt-8 space-y-8">
            {chant.queue.map((part, i) => (
              <section key={part.slug}>
                <div className="flex items-baseline gap-3">
                  <h2 className="type-feature text-ink">
                    {chant.parts?.[i]?.label ?? `ท่อนที่ ${i + 1}`}
                  </h2>
                  {part.repeatable && (
                    <span
                      className={`rounded-full px-2 py-[2px] text-[10.5px] font-semibold leading-[1.33] ${
                        playing ? "bg-green text-on-green" : "bg-mid text-ink"
                      }`}
                    >
                      {playing
                        ? `ท่อง ${liveRounds} จบ`
                        : `ท่อง ${part.rounds} จบ · ปรับได้ตอนฟัง`}
                    </span>
                  )}
                </div>
                <Transcript chant={part} heading={null} />
              </section>
            ))}
          </div>
        ) : (
          <Transcript chant={chant} />
        )}
      </div>

      {related.length > 0 && (
        <div className="mt-10 lg:px-8">
          <Rail title="บทสวดที่เกี่ยวข้อง" items={related} />
        </div>
      )}
    </article>
  );
}
