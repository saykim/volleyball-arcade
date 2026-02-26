"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppNav } from "@/components/app-nav";
import { LanguageToggle } from "@/components/language-toggle";
import { RoleSwitcher } from "@/components/role-switcher";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { useI18n } from "@/lib/i18n";
import { canAccessRoute } from "@/lib/permissions";
import { RoleProvider, useRole } from "@/lib/role-context";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <AppShellBody>{children}</AppShellBody>
    </RoleProvider>
  );
}

function AppShellBody({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { role } = useRole();
  const pathname = usePathname();
  const access = canAccessRoute(role, pathname);

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col">
      <ServiceWorkerRegister />
      <header className="border-b-4 border-black bg-[var(--panel)] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-soft)]">{t("app.headerTag")}</p>
            <h1 className="text-xl font-black uppercase">{t("app.title")}</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <RoleSwitcher />
            <LanguageToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 px-3 py-4">
        {access.allowed ? (
          children
        ) : (
          <section className="pixel-panel space-y-3">
            <h2 className="text-lg font-black uppercase">{t("auth.restrictedTitle")}</h2>
            <p className="text-sm font-semibold">{access.message}</p>
            <p className="text-xs text-[var(--ink-soft)]">{t("auth.restrictedHint")}</p>
            <Link href="/" className="pixel-btn inline-block">
              {t("auth.goHome")}
            </Link>
          </section>
        )}
      </main>
      <AppNav role={role} />
    </div>
  );
}
