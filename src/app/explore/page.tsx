import type { Metadata } from "next";
import { ExploreView } from "@/components/ExploreView";
import { getChants, getPlaylists, getUsedCategories } from "@/lib/content";

export const metadata: Metadata = { title: "สำรวจ" };

export default function ExplorePage() {
  const chants = getChants();
  return (
    <ExploreView
      chants={chants}
      playlists={getPlaylists()}
      categories={getUsedCategories(chants)}
    />
  );
}
