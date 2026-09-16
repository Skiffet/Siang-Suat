import type { Metadata } from "next";
import { LibraryView } from "@/components/LibraryView";
import { getChants, getPlaylists } from "@/lib/content";

export const metadata: Metadata = { title: "ห้องสมุด" };

export default function LibraryPage() {
  return <LibraryView playlists={getPlaylists()} chants={getChants()} />;
}
