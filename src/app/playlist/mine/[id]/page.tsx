import type { Metadata } from "next";
import { MyPlaylistDetail } from "@/components/MyPlaylistDetail";
import { getChants } from "@/lib/content";

export const metadata: Metadata = { title: "เพลย์ลิสต์ของฉัน" };

export const dynamicParams = true;
export function generateStaticParams() {
  // These live in the browser, so there is nothing to prerender by id.
  return [];
}

export default async function MyPlaylistPage({
  params,
}: PageProps<"/playlist/mine/[id]">) {
  const { id } = await params;
  return <MyPlaylistDetail id={id} chants={getChants()} />;
}
