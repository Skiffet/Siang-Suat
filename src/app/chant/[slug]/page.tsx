import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChantDetail } from "@/components/ChantDetail";
import { getChant, getChants, loadChants } from "@/lib/content";

export function generateStaticParams() {
  return loadChants().map((chant) => ({ slug: chant.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/chant/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const chant = getChant(slug);
  if (!chant) return {};
  return { title: chant.title, description: chant.description };
}

export default async function ChantPage({ params }: PageProps<"/chant/[slug]">) {
  const { slug } = await params;
  const chant = getChant(slug);
  if (!chant) notFound();

  // Related chants share a tag; the queue that play() gets is this page's list.
  const related = getChants().filter(
    (c) => c.slug !== chant.slug && c.tags?.some((t) => chant.tags?.includes(t)),
  );

  return <ChantDetail chant={chant} related={related.slice(0, 6)} />;
}
