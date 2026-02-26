"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();

  return (
    <section className="space-y-4">
      <div className="pixel-panel">
        <h2 className="text-xl font-black uppercase">{t("home.title")}</h2>
        <p className="mt-2 text-sm">{t("home.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Link className="pixel-panel text-center font-black uppercase" href="/team">
          {t("home.teamRoster")}
        </Link>
        <Link className="pixel-panel text-center font-black uppercase" href="/sessions">
          {t("home.sessionsEvents")}
        </Link>
        <Link className="pixel-panel text-center font-black uppercase" href="/insights">
          {t("home.insights")}
        </Link>
        <Link className="pixel-panel text-center font-black uppercase" href="/player-mode">
          {t("home.playMode")}
        </Link>
        <Link className="pixel-panel text-center font-black uppercase" href="/board">
          {t("home.board")}
        </Link>
        <Link className="pixel-panel text-center font-black uppercase" href="/help">
          {t("home.help")}
        </Link>
      </div>
    </section>
  );
}
