import Link from "next/link";
import type { ChantWithAudio } from "@/lib/types";
import { ChantCard } from "./ChantCard";
import { ChevronRightIcon } from "./Icons";

/**
 * A horizontal shelf of covers.
 *
 * It scrolls rather than wrapping, so the section below always starts at a
 * predictable place no matter how much content a shelf holds.
 */
export function Rail({
  title,
  href,
  items,
  preloadFirst = false,
}: {
  title: string;
  href?: string;
  items: ChantWithAudio[];
  preloadFirst?: boolean;
}) {
  if (!items.length) return null;

  return (
    <section className="mt-8 first:mt-0">
      <div className="mb-2 flex items-baseline justify-between gap-4 px-4 lg:px-0">
        <h2 className="type-feature text-ink sm:type-section">{title}</h2>
        {href && (
          <Link
            href={href}
            className="flex shrink-0 items-center gap-0.5 type-small-bold text-muted transition-colors hover:text-ink"
          >
            ดูทั้งหมด
            <ChevronRightIcon size={12} />
          </Link>
        )}
      </div>

      <div className="no-scrollbar flex gap-1 overflow-x-auto px-2 pb-1 lg:px-0">
        {items.map((chant, i) => (
          <ChantCard
            key={chant.slug}
            chant={chant}
            queue={items}
            preload={preloadFirst && i < 3}
          />
        ))}
      </div>
    </section>
  );
}
