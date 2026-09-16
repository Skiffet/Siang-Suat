"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./navItems";
import { NavIcon } from "./NavIcon";

/**
 * The mobile bottom bar — the sidebar's replacement below `lg`.
 *
 * It sits on a gradient into the page base rather than a hard edge, so the
 * content appears to run underneath it instead of stopping at a border.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-gradient-to-t from-base via-base to-base/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2 transition-colors duration-150 ${
                  active ? "text-green" : "text-muted"
                }`}
              >
                <NavIcon name={item.icon} active={active} size={21} />
                <span
                  className={active ? "type-micro font-bold" : "type-micro"}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
