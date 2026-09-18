import { ClockIcon, HomeIcon, LibraryIcon, UserIcon } from "../Icons";
import type { NavIcon as NavIconName } from "./navItems";

export function NavIcon({
  name,
  active,
  size = 24,
}: {
  name: NavIconName;
  active: boolean;
  size?: number;
}) {
  switch (name) {
    case "home":
      return <HomeIcon size={size} filled={active} />;
    case "library":
      return <LibraryIcon size={size} filled={active} />;
    case "clock":
      return <ClockIcon size={size} />;
    case "user":
      return <UserIcon size={size} />;
  }
}
