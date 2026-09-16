/** The five destinations, shared by the sidebar and the mobile bottom bar. */
export const NAV_ITEMS = [
  { href: "/", label: "หน้าแรก", icon: "home" },
  { href: "/explore", label: "สำรวจ", icon: "search" },
  { href: "/playlist", label: "เพลย์ลิสต์", icon: "library" },
  { href: "/timer", label: "เวลาฟัง", icon: "clock" },
  { href: "/profile", label: "โปรไฟล์", icon: "user" },
] as const;

export type NavIcon = (typeof NAV_ITEMS)[number]["icon"];
