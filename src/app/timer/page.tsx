import type { Metadata } from "next";
import { TimerView } from "@/components/TimerView";
import { getChants } from "@/lib/content";

export const metadata: Metadata = { title: "เวลาฟัง" };

export default function TimerPage() {
  return <TimerView chants={getChants().filter((c) => c.audioUrl)} />;
}
