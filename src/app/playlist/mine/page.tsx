import type { Metadata } from "next";
import { Suspense } from "react";
import { MyPlaylistDetail } from "@/components/MyPlaylistDetail";
import { getChants } from "@/lib/content";

export const metadata: Metadata = { title: "เพลย์ลิสต์ของฉัน" };

/**
 * A static shell for every `?id=`, not one dynamic route per id — see the
 * matching note on the editor's page.tsx. Opening a playlist you made should
 * never wait on the server, since the server has nothing id-specific to say.
 */
export default function MyPlaylistPage() {
  return (
    <Suspense fallback={null}>
      <MyPlaylistDetail chants={getChants()} />
    </Suspense>
  );
}
