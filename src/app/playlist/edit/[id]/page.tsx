import type { Metadata } from "next";
import { PlaylistEditor } from "@/components/PlaylistEditor";
import { getChants } from "@/lib/content";

export const metadata: Metadata = { title: "แก้ไขเพลย์ลิสต์" };

export const dynamicParams = true;
export function generateStaticParams() {
  // These live in the browser, so there is nothing to prerender by id.
  return [];
}

export default async function EditPlaylistPage({ params }: PageProps<"/playlist/edit/[id]">) {
  const { id } = await params;
  return <PlaylistEditor id={id} chants={getChants()} />;
}
