"use client";

import type { PlaylistEntry } from "./types";

/**
 * Sittings the listener arranged themselves.
 *
 * There is no account and no server, so these live in the browser. That means
 * they belong to one device and one browser, and clearing site data takes
 * them with it — fine for arranging your own morning chanting, not a place to
 * keep anything you would be sorry to lose.
 */
export interface Sitting {
  id: string;
  title: string;
  /** Cover stem, borrowed from the first chant so the row is never blank. */
  cover: string;
  entries: PlaylistEntry[];
  updatedAt: string;
}

const KEY = "siang-suad.sittings.v1";

/** Storage throws in private windows and when site data is blocked. */
function read(): Sitting[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Sitting[]) : [];
  } catch {
    return [];
  }
}

function write(list: Sitting[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function loadSittings(): Sitting[] {
  return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSitting(id: string): Sitting | undefined {
  return read().find((s) => s.id === id);
}

export function saveSitting(sitting: Omit<Sitting, "updatedAt">): boolean {
  const list = read();
  const at = list.findIndex((s) => s.id === sitting.id);
  const next = { ...sitting, updatedAt: new Date().toISOString() };
  if (at >= 0) list[at] = next;
  else list.push(next);
  return write(list);
}

export function deleteSitting(id: string): boolean {
  return write(read().filter((s) => s.id !== id));
}

export function newSittingId(): string {
  return `s${Date.now().toString(36)}`;
}
