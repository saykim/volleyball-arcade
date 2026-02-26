"use client";

import type { ReactNode } from "react";

import { AppNav } from "@/components/app-nav";
import { LanguageToggle } from "@/components/language-toggle";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { useI18n } from "@/lib/i18n";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col">
      <ServiceWorkerRegister />
      <header className="border-b-4 border-black bg-[var(--panel)] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-soft)]">{t("app.headerTag")}</p>
            <h1 className="text-xl font-black uppercase">{t("app.title")}</h1>
          </div>
          <LanguageToggle />
        </div>
      </header>
      <main className="flex-1 px-3 py-4">{children}</main>
      <AppNav />
    </div>
  );
}
