"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChantWithAudio, QueuedChant } from "@/lib/types";

export type RepeatMode = "off" | "all" | "one";

interface PlayerValue {
  queue: ChantWithAudio[];
  index: number;
  current: ChantWithAudio | null;
  /** The chant queued after this one — what the "กำลังเล่นถัดไป" panel shows. */
  upNext: ChantWithAudio | null;
  playing: boolean;
  time: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  /** Whether the full-screen player is covering the app. */
  expanded: boolean;
  /** Seconds left on the sleep timer, or null when none is running. */
  sleepLeftSec: number | null;
  /** Playback rate, for people who chant faster or slower than the recording. */
  rate: number;
  /** How many times through the chant this sitting is — 3 จบ, 9 จบ, 108 จบ. */
  rounds: number;
  /** Which round is being chanted now, counting from one. */
  round: number;
  /** Set when a chant has no audio yet, so the UI can say so instead of stalling. */
  notice: string | null;

  play(chant: ChantWithAudio, queue?: ChantWithAudio[]): void;
  playQueue(queue: ChantWithAudio[], startAt?: number): void;
  toggle(): void;
  next(): void;
  prev(): void;
  seek(seconds: number): void;
  toggleShuffle(): void;
  cycleRepeat(): void;
  setExpanded(open: boolean): void;
  startSleepTimer(minutes: number | null): void;
  setRate(rate: number): void;
  setRounds(rounds: number): void;
  isCurrent(slug: string): boolean;
}

const PlayerContext = createContext<PlayerValue | null>(null);

export function usePlayer(): PlayerValue {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return value;
}

/** Fisher–Yates, keeping `first` at the head so shuffle never skips your pick. */
function shuffled(list: ChantWithAudio[], first: ChantWithAudio) {
  const rest = list.filter((c) => c.slug !== first.slug);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [first, ...rest];
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [queue, setQueue] = useState<ChantWithAudio[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [expanded, setExpanded] = useState(false);
  /** Epoch ms the timer fires at; `sleepLeftSec` is what the UI prints. */
  const [sleepAt, setSleepAt] = useState<number | null>(null);
  const [sleepLeftSec, setSleepLeftSec] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rate, setRateState] = useState(1);
  const [rounds, setRoundsState] = useState(1);
  const [round, setRound] = useState(1);

  // `start` is memoised without the rate as a dependency, so it reads the
  // current value through a ref. The ref is written where the rate changes,
  // never during render.
  const rateRef = useRef(1);
  // The ended handler must not be rebuilt every time a round ticks over, or
  // the listener is torn down mid-chant. Both are written only in callbacks.
  const roundsRef = useRef(1);
  const roundRef = useRef(1);
  const indexRef = useRef(0);

  const current = queue[index] ?? null;
  const upNext = queue[index + 1] ?? (repeat === "all" ? queue[0] ?? null : null);

  /** Load a track and start it. Kept in one place so every entry point matches. */
  const start = useCallback((list: ChantWithAudio[], at: number) => {
    const chant = list[at];
    if (!chant) return;
    if (!chant.audioUrl) {
      // Catalogue entries without a take are still browsable; just say so.
      setNotice(`"${chant.title}" ยังไม่มีไฟล์เสียง`);
      return;
    }
    setNotice(null);
    setQueue(list);
    setIndex(at);
    indexRef.current = at;
    setTime(0);

    // A sitting decides the count for each chant it holds; a chant played on
    // its own falls back to the count it is usually kept at.
    const wanted =
      (chant as Partial<QueuedChant>).rounds ?? chant.defaultRounds ?? 1;
    roundsRef.current = wanted;
    setRoundsState(wanted);
    const el = audioRef.current;
    if (!el) return;
    el.src = chant.audioUrl;
    el.currentTime = 0;
    el.playbackRate = rateRef.current;
    roundRef.current = 1;
    setRound(1);
    void el.play().catch(() => setPlaying(false));
  }, []);

  const play = useCallback(
    (chant: ChantWithAudio, list?: ChantWithAudio[]) => {
      const base = list?.length ? list : [chant];
      const ordered = shuffle ? shuffled(base, chant) : base;
      const at = ordered.findIndex((c) => c.slug === chant.slug);
      start(ordered, at < 0 ? 0 : at);
    },
    [shuffle, start],
  );

  const playQueue = useCallback(
    (list: ChantWithAudio[], startAt = 0) => {
      // Pressing play on a playlist should land on something audible.
      const firstPlayable = list.findIndex((c, i) => i >= startAt && c.audioUrl);
      start(list, firstPlayable < 0 ? startAt : firstPlayable);
    },
    [start],
  );

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (el.paused) void el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [current]);

  /** Step through the queue, stepping over entries that have no audio. */
  const step = useCallback(
    (delta: number) => {
      if (!queue.length) return;
      for (let i = 1; i <= queue.length; i++) {
        let at = index + delta * i;
        if (repeat === "all") at = (at + queue.length * i) % queue.length;
        if (at < 0 || at >= queue.length) break;
        if (queue[at].audioUrl) {
          start(queue, at);
          return;
        }
      }
      // Nothing further to play — stop at the end rather than looping silently.
      audioRef.current?.pause();
    },
    [index, queue, repeat, start],
  );

  const next = useCallback(() => step(1), [step]);

  /** Under 3 seconds in, "previous" means the previous track; after that, restart. */
  const prev = useCallback(() => {
    const el = audioRef.current;
    if (el && el.currentTime > 3) {
      el.currentTime = 0;
      return;
    }
    step(-1);
  }, [step]);

  const seek = useCallback((seconds: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = seconds;
    setTime(seconds);
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);

  const cycleRepeat = useCallback(
    () =>
      setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    [],
  );

  const startSleepTimer = useCallback((minutes: number | null) => {
    const el = audioRef.current;
    if (el) el.volume = 1; // undo any fade left over from a cancelled timer
    if (minutes == null) {
      setSleepAt(null);
      setSleepLeftSec(null);
      return;
    }
    setSleepAt(Date.now() + minutes * 60_000);
    setSleepLeftSec(minutes * 60);
  }, []);

  /**
   * Changing the rate has to touch the element directly: `playbackRate` is a
   * property of the media element rather than something React re-renders, and
   * it resets to 1 whenever a new source loads.
   */
  const setRounds = useCallback((next: number) => {
    roundsRef.current = next;
    setRoundsState(next);
    setQueue((q) =>
      q.map((c, i) => (i === indexRef.current ? { ...c, rounds: next } : c)),
    );
    // Lowering the count below where you already are ends the sitting on this
    // pass rather than retroactively finishing it.
    if (roundRef.current > next) {
      roundRef.current = next;
      setRound(next);
    }
  }, []);

  const setRate = useCallback((next: number) => {
    rateRef.current = next;
    setRateState(next);
    const el = audioRef.current;
    if (el) el.playbackRate = next;
  }, []);

  const isCurrent = useCallback(
    (slug: string) => current?.slug === slug,
    [current],
  );

  // Audio element events. `durationchange` matters because the manifest length
  // and the decoded length can differ by a frame or two.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setTime(el.currentTime);
    const onDuration = () => setDuration(el.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      // Rounds come first: a chant set to 3 จบ finishes all three before the
      // queue or the repeat mode gets a say.
      if (roundRef.current < roundsRef.current) {
        roundRef.current += 1;
        setRound(roundRef.current);
        el.currentTime = 0;
        void el.play();
        return;
      }
      if (repeat === "one") {
        roundRef.current = 1;
        setRound(1);
        el.currentTime = 0;
        void el.play();
        return;
      }
      step(1);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("durationchange", onDuration);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("durationchange", onDuration);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [repeat, step]);

  // Sleep timer. Fades the last 10 seconds rather than cutting mid-syllable.
  //
  // The countdown is derived from a deadline rather than decremented each tick,
  // so a backgrounded tab that stops firing timers still stops at the right
  // moment instead of drifting minutes late.
  useEffect(() => {
    if (sleepAt == null) return;
    const tick = () => {
      const left = Math.max(0, Math.round((sleepAt - Date.now()) / 1000));
      const el = audioRef.current;
      if (el) el.volume = left <= 10 ? left / 10 : 1;
      setSleepLeftSec(left);
      if (left <= 0) {
        el?.pause();
        if (el) el.volume = 1;
        setSleepAt(null);
        setSleepLeftSec(null);
      }
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sleepAt]);

  // Lock-screen and headphone controls.
  useEffect(() => {
    if (!current || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: "เสียงสวด Podcast",
      album: current.subtitle ?? "บทสวดมนต์",
      artwork: [
        { src: `/covers/${current.cover}.jpg`, sizes: "800x800", type: "image/jpeg" },
      ],
    });
    navigator.mediaSession.setActionHandler("play", () => void audioRef.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("previoustrack", prev);
    navigator.mediaSession.setActionHandler("nexttrack", next);
  }, [current, next, prev]);

  // The notice is a transient message, not a state the user has to dismiss.
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(id);
  }, [notice]);

  // The full-screen player is a layer over the app, so the page beneath it
  // should not scroll, and Escape should close it.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const value = useMemo<PlayerValue>(
    () => ({
      queue,
      index,
      current,
      upNext,
      playing,
      time,
      duration: duration || current?.durationSec || 0,
      shuffle,
      repeat,
      expanded,
      sleepLeftSec,
      rate,
      rounds,
      round,
      notice,
      play,
      playQueue,
      toggle,
      next,
      prev,
      seek,
      toggleShuffle,
      cycleRepeat,
      setExpanded,
      startSleepTimer,
      setRate,
      setRounds,
      isCurrent,
    }),
    [
      queue, index, current, upNext, playing, time, duration, shuffle, repeat,
      expanded, sleepLeftSec, rate, rounds, round, notice, play, playQueue,
      toggle, next, prev, seek, toggleShuffle, cycleRepeat, startSleepTimer,
      setRate, setRounds, isCurrent,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </PlayerContext.Provider>
  );
}
