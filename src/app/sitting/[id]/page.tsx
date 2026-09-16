import type { Metadata } from "next";
import { SittingEditor } from "@/components/SittingEditor";
import { getChants } from "@/lib/content";

export const metadata: Metadata = { title: "จัดการสวด" };

export const dynamicParams = true;
export function generateStaticParams() {
  // Sittings live in the browser, so there is nothing to prerender by id.
  return [];
}

export default async function SittingPage({ params }: PageProps<"/sitting/[id]">) {
  const { id } = await params;
  return <SittingEditor id={id} chants={getChants()} />;
}
