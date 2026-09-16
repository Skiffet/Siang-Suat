"use client";

import { useRef, useState } from "react";

export interface Sample {
  file: string;
  name: string;
  note: string;
  seconds: number;
}

/** Plays one sample at a time, so A/B comparison never turns into a pile-up. */
export function VoiceCompare({ samples }: { samples: Sample[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<string | null>(null);

  function toggle(file: string) {
    const el = audioRef.current;
    if (!el) return;
    if (current === file && !el.paused) {
      el.pause();
      setCurrent(null);
      return;
    }
    el.src = `/audio/test/${file}`;
    el.currentTime = 0;
    void el.play();
    setCurrent(file);
  }

  return (
    <>
      <audio ref={audioRef} onEnded={() => setCurrent(null)} hidden />
      <ol className="space-y-3">
        {samples.map((s) => {
          const active = current === s.file;
          return (
            <li key={s.file}>
              <button
                type="button"
                onClick={() => toggle(s.file)}
                aria-label={`${active ? "หยุด" : "เล่น"} ${s.name}`}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors duration-200 ${
                  active
                    ? "border-green bg-card"
                    : "border-line bg-surface hover:border-muted"
                }`}
              >
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-full transition-transform duration-150 ${
                    active ? "bg-green text-on-green" : "bg-mid text-green"
                  }`}
                >
                  {active ? (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <rect x="4" y="3" width="4" height="14" rx="1.5" />
                      <rect x="12" y="3" width="4" height="14" rx="1.5" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path d="M5 3.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 5 3.5Z" />
                    </svg>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="type-caption-bold block">{s.name}</span>
                  <span className="type-caption text-muted block">{s.note}</span>
                </span>

                <span className="type-caption text-muted shrink-0">
                  {s.seconds.toFixed(1)}s
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}
