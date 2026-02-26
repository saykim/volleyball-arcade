"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n";
import { canAccessRoute } from "@/lib/permissions";
import { useRole } from "@/lib/role-context";

const HOME_LINKS = [
  { href: "/team", labelKey: "home.teamRoster" },
  { href: "/sessions", labelKey: "home.sessionsEvents" },
  { href: "/insights", labelKey: "home.insights" },
  { href: "/player-mode", labelKey: "home.playMode" },
  { href: "/board", labelKey: "home.board" },
  { href: "/help", labelKey: "home.help" },
] as const;

export default function Home() {
  const { t } = useI18n();
  const { role } = useRole();
  const visibleLinks = HOME_LINKS.filter((link) => canAccessRoute(role, link.href).allowed);

  return (
    <section className="space-y-4">
      <div className="pixel-panel">
        <h2 className="text-xl font-black uppercase">{t("home.title")}</h2>
        <p className="mt-2 text-sm">{t("home.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visibleLinks.map((item) => (
          <Link key={item.href} className="pixel-panel text-center font-black uppercase" href={item.href}>
            {t(item.labelKey)}
          </Link>
        ))}
      </div>
    </section>
  );
}
