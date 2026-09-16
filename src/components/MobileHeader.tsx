import Link from "next/link";
import { Brand } from "./Brand";
import { BellIcon, SearchIcon } from "./Icons";

/**
 * The mobile header: wordmark, notifications, avatar, and the search pill.
 *
 * Hidden on desktop, where the sidebar already carries the brand and the
 * search field belongs to the explore page.
 */
export function MobileHeader() {
  return (
    <header className="px-4 pt-[calc(16px+env(safe-area-inset-top))] lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <Brand tagline />
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="การแจ้งเตือน"
            className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-mid hover:text-ink"
          >
            <BellIcon size={20} />
          </button>
          <Link
            href="/profile"
            aria-label="โปรไฟล์"
            className="grid size-9 place-items-center rounded-full bg-mid type-small-bold text-muted"
          >
            ธ
          </Link>
        </div>
      </div>

      <Link
        href="/explore"
        className="mt-4 flex items-center gap-3 rounded-[500px] bg-mid px-4 py-3 text-muted transition-colors hover:bg-card"
      >
        <SearchIcon size={18} />
        <span className="type-caption">ค้นหาบทสวด ธรรมะ หรือหัวข้อที่สนใจ</span>
      </Link>
    </header>
  );
}
