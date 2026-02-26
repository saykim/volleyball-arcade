"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n, type MessageKey } from "@/lib/i18n";
import { canAccessRoute, type UserRole } from "@/lib/permissions";

const NAV_ITEMS = [
  { href: "/", labelKey: "nav.home" },
  { href: "/team", labelKey: "nav.team" },
  { href: "/sessions", labelKey: "nav.sessions" },
  { href: "/insights", labelKey: "nav.insights" },
  { href: "/player-mode", labelKey: "nav.playMode" },
  { href: "/board", labelKey: "nav.board" },
  { href: "/help", labelKey: "nav.help" },
] as const satisfies ReadonlyArray<{ href: string; labelKey: MessageKey }>;

function normalizePathname(pathname: string): string {
  return pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
}

export function AppNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const normalizedPathname = normalizePathname(pathname);
  const { t } = useI18n();
  const visibleItems = NAV_ITEMS.filter((item) => canAccessRoute(role, item.href).allowed);

  return (
    <nav className="sticky bottom-0 z-20 border-t-4 border-black bg-[var(--panel)] px-2 py-2">
      <ul className="mx-auto grid max-w-4xl grid-cols-4 gap-1 text-center text-[10px] font-bold uppercase sm:grid-cols-6 sm:text-xs">
        {visibleItems.map((item) => {
          const active = normalizedPathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-none border-2 border-black px-1 py-2 transition-transform active:translate-y-[1px] ${
                  active
                    ? "bg-[var(--accent)] text-black shadow-[2px_2px_0_0_#000]"
                    : "bg-[var(--panel-soft)] text-[var(--ink)]"
                }`}
              >
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
