import type { Metadata } from "next";
import { Suspense } from "react";
import { PlaylistEditor } from "@/components/PlaylistEditor";
import { getChants } from "@/lib/content";

export const metadata: Metadata = { title: "แก้ไขเพลย์ลิสต์" };

/**
 * A static shell for every `?id=`, not one dynamic route per id.
 *
 * The id is minted in the browser and only ever looked up in localStorage —
 * the server has nothing to render differently for one id versus another. A
 * `[id]` path segment would force Next to render this page on the server for
 * every never-seen-before id (i.e. every single "new playlist" tap), which
 * is exactly the lag this sidesteps: the shell below is prerendered once,
 * and `PlaylistEditor` reads `?id=` client-side after it loads instantly.
 */
export default function EditPlaylistPage() {
  return (
    <Suspense fallback={null}>
      <PlaylistEditor chants={getChants()} />
    </Suspense>
  );
}
