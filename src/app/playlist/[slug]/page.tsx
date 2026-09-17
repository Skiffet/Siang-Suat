import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaylistDetail } from "@/components/PlaylistDetail";
import { getPlaylist, getPlaylists } from "@/lib/content";

export function generateStaticParams() {
  return getPlaylists().map((playlist) => ({ slug: playlist.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/playlist/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const playlist = getPlaylist(slug);
  if (!playlist) return {};
  return { title: playlist.title, description: playlist.description };
}

export default async function PlaylistPage({
  params,
}: PageProps<"/playlist/[slug]">) {
  const { slug } = await params;
  const playlist = getPlaylist(slug);
  if (!playlist) notFound();
  return <PlaylistDetail playlist={playlist} reminderKey={`curated:${playlist.slug}`} />;
}
