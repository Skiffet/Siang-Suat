import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { getPlaylists } from "@/lib/content";
import "./globals.css";

/*
 * DESIGN.md runs a bold/regular binary at 700 and 400, with 600 reserved for
 * feature headings and badges — so those three weights, and nothing else.
 * IBM Plex Sans Thai is the closest Thai-capable stand-in for Circular.
 */
const sans = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-plex-thai",
  display: "swap",
});

/** Used only for Pali, which should read as scripture rather than as UI. */
const serif = Noto_Serif_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
  variable: "--font-serif-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "เสียงสวด — Podcast สวดมนต์เพื่อชีวิตที่สงบกว่าเดิม",
    template: "%s · เสียงสวด",
  },
  description:
    "ฟังบทสวดมนต์ ธรรมะ และเสียงนำสมาธิ พร้อมคำแปลอ่านตามได้ ตั้งเวลาปิดอัตโนมัติ ฟังได้ทุกที่ทุกเวลา",
  appleWebApp: {
    capable: true,
    title: "เสียงสวด",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#121212",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read once here so the sidebar's playlist list is identical on every route.
  const playlists = getPlaylists();

  return (
    <html lang="th" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <PlayerProvider>
          <AppShell playlists={playlists}>{children}</AppShell>
        </PlayerProvider>
      </body>
    </html>
  );
}
