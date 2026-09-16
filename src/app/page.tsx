import { MobileHeader } from "@/components/MobileHeader";
import { Rail } from "@/components/Rail";
import { HeroRow } from "@/components/HeroRow";
import { PlaylistGrid } from "@/components/PlaylistGrid";
import { getPlaylists, getShelves } from "@/lib/content";

export default function Home() {
  const shelves = getShelves();
  const playlists = getPlaylists();

  return (
    <>
      <MobileHeader />

      <div className="px-0 py-6 lg:px-8 lg:py-8">
        <div className="hidden lg:block">
          <HeroRow />
        </div>

        {/* The quick-pick grid the home screen opens on. */}
        <PlaylistGrid playlists={playlists.slice(0, 6)} />

        {shelves.map((shelf, i) => (
          <Rail
            key={shelf.slug}
            title={shelf.title}
            href="/explore"
            items={shelf.items}
            preloadFirst={i === 0}
          />
        ))}
      </div>
    </>
  );
}
