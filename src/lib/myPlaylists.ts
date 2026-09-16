"use client";

import type { PlaylistEntry } from "./types";

/**
 * Playlists the listener made themselves.
 *
 * The same idea as the ones in `content/playlists`, which are shortcuts we
 * arranged for them; these are the ones they arranged. There is no account
 * and no server, so they live in the browser — one device, one browser, and
 * gone with the site data. Fine for arranging your own morning chanting, not
 * a place to keep anything you would be sorry to lose.
 */
export interface MyPlaylist {
  id: string;
  title: string;
  /** Cover stem, borrowed from the first chant so the row is never blank. */
  cover: string;
  entries: PlaylistEntry[];
  updatedAt: string;
}

const KEY = "siang-suad.my-playlists.v1";

/** Storage throws in private windows and when site data is blocked. */
function read(): MyPlaylist[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MyPlaylist[]) : [];
  } catch {
    return [];
  }
}

function write(list: MyPlaylist[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function loadMyPlaylists(): MyPlaylist[] {
  return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getMyPlaylist(id: string): MyPlaylist | undefined {
  return read().find((s) => s.id === id);
}

export function saveMyPlaylist(sitting: Omit<MyPlaylist, "updatedAt">): boolean {
  const list = read();
  const at = list.findIndex((s) => s.id === sitting.id);
  const next = { ...sitting, updatedAt: new Date().toISOString() };
  if (at >= 0) list[at] = next;
  else list.push(next);
  return write(list);
}

export function deleteMyPlaylist(id: string): boolean {
  return write(read().filter((s) => s.id !== id));
}

export function newMyPlaylistId(): string {
  return `s${Date.now().toString(36)}`;
}
