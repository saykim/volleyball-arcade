import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Volley Arcade",
  description: "Offline-first volleyball stat tracker for team captains and managers.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <I18nProvider>
          <AppShell>{children}</AppShell>
        </I18nProvider>
      </body>
    </html>
  );
}
