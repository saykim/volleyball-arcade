"use client";

import { useI18n } from "@/lib/i18n";

export function LanguageToggle() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="flex items-center gap-1" aria-label={t("lang.switch")}>
      <button
        type="button"
        className={`border-2 border-black px-2 py-1 text-xs font-black uppercase ${
          language === "ko" ? "bg-[var(--accent)]" : "bg-white"
        }`}
        onClick={() => setLanguage("ko")}
      >
        {t("lang.kr")}
      </button>
      <button
        type="button"
        className={`border-2 border-black px-2 py-1 text-xs font-black uppercase ${
          language === "en" ? "bg-[var(--accent)]" : "bg-white"
        }`}
        onClick={() => setLanguage("en")}
      >
        {t("lang.en")}
      </button>
    </div>
  );
}
