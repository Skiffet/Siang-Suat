import type { Metadata } from "next";
import { PlaylistsView } from "@/components/PlaylistsView";
import { getChants, getPlaylists } from "@/lib/content";

export const metadata: Metadata = { title: "เพลย์ลิสต์" };

export default function PlaylistsPage() {
  return <PlaylistsView playlists={getPlaylists()} chants={getChants()} />;
}
