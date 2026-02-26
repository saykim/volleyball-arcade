"use client";

import type { Team } from "@/lib/domain";
import { useI18n, type MessageKey } from "@/lib/i18n";

interface TeamSelectorProps {
  teams: Team[];
  teamId: number | null;
  onChange: (teamId: number) => void;
  labelKey?: MessageKey;
}

export function TeamSelector({ teams, teamId, onChange, labelKey = "team.selectorLabel" }: TeamSelectorProps) {
  const { t } = useI18n();

  if (teams.length === 0) {
    return <p className="text-sm">{t("team.empty")}</p>;
  }

  return (
    <label className="flex flex-col gap-1 text-sm font-semibold">
      {t(labelKey)}
      <select
        className="pixel-input"
        value={teamId ?? teams[0].id}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </label>
  );
}
