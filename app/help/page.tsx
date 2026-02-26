"use client";

import { useI18n } from "@/lib/i18n";

export default function HelpPage() {
  const { t } = useI18n();

  return (
    <section className="space-y-4">
      <div className="pixel-panel space-y-2">
        <h2 className="text-lg font-black uppercase">{t("help.title")}</h2>
        <p className="text-sm">{t("help.subtitle")}</p>
      </div>

      <article className="pixel-panel space-y-2">
        <h3 className="text-base font-black uppercase">{t("help.sectionTeamTitle")}</h3>
        <p className="text-sm">{t("help.sectionTeamBody")}</p>
      </article>

      <article className="pixel-panel space-y-2">
        <h3 className="text-base font-black uppercase">{t("help.sectionPlayersTitle")}</h3>
        <p className="text-sm">{t("help.sectionPlayersBody")}</p>
      </article>

      <article className="pixel-panel space-y-2">
        <h3 className="text-base font-black uppercase">{t("help.sectionSessionTitle")}</h3>
        <p className="text-sm">{t("help.sectionSessionBody")}</p>
      </article>

      <article className="pixel-panel space-y-2">
        <h3 className="text-base font-black uppercase">{t("help.sectionQuickTitle")}</h3>
        <p className="text-sm">{t("help.sectionQuickBody")}</p>
      </article>

      <article className="pixel-panel space-y-2">
        <h3 className="text-base font-black uppercase">{t("help.sectionPlayTitle")}</h3>
        <p className="text-sm">{t("help.sectionPlayBody")}</p>
      </article>

      <article className="pixel-panel space-y-2">
        <h3 className="text-base font-black uppercase">{t("help.sectionPrivacyTitle")}</h3>
        <p className="text-sm">{t("help.sectionPrivacyBody")}</p>
      </article>
    </section>
  );
}
