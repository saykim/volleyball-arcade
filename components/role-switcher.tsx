"use client";

import { useI18n } from "@/lib/i18n";
import { useRole } from "@/lib/role-context";
import type { UserRole } from "@/lib/permissions";

const ROLE_LABEL_KEYS: Record<UserRole, "role.player" | "role.manager" | "role.captain"> = {
  player: "role.player",
  manager: "role.manager",
  captain: "role.captain",
};

const ROLE_ORDER: ReadonlyArray<UserRole> = ["player", "manager", "captain"];

export function RoleSwitcher() {
  const { role, setRole } = useRole();
  const { t } = useI18n();

  return (
    <label className="flex items-center gap-2 text-xs font-black uppercase">
      <span>{t("role.label")}</span>
      <select
        className="pixel-input min-w-28 bg-white py-1 text-xs"
        value={role}
        onChange={(event) => setRole(event.target.value as UserRole)}
      >
        {ROLE_ORDER.map((option) => (
          <option key={option} value={option}>
            {t(ROLE_LABEL_KEYS[option])}
          </option>
        ))}
      </select>
    </label>
  );
}
