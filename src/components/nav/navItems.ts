/**
 * The destinations shared by the sidebar and the mobile bottom bar.
 *
 * "สำรวจ" is left out for now rather than deleted — the /explore route and
 * its search are still reachable from the rails' "ดูทั้งหมด" links and the
 * home search pill, just not promoted to a tab until it's actually used.
 */
export const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/playlist", label: "เพลย์ลิสต์", icon: "library" },
  { href: "/timer", label: "เวลาฟัง", icon: "clock" },
  { href: "/profile", label: "โปรไฟล์", icon: "user" },
] as const;

export type NavIcon = (typeof NAV_ITEMS)[number]["icon"];
