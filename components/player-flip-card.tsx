"use client";

import type { Player, PlayerInsight, PlayerStats } from "@/lib/domain";
import { useI18n } from "@/lib/i18n";

const POSITION_LABEL_KEYS = {
  setter: "position.setter",
  outside: "position.outside",
  middle: "position.middle",
  opposite: "position.opposite",
  libero: "position.libero",
} as const;

interface PlayerFlipCardProps {
  player: Player;
  stats: PlayerStats;
  insight: PlayerInsight;
  flipped: boolean;
  onToggle: () => void;
}

export function PlayerFlipCard({
  player,
  stats,
  insight,
  flipped,
  onToggle,
}: PlayerFlipCardProps) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={onToggle}
      className="card-wrap text-left"
      aria-label={t("flip.aria", { name: player.displayName })}
    >
      <span className={`card-3d ${flipped ? "is-flipped" : ""}`}>
        <span className="card-face card-front">
          <span className="mb-3 block border-b-2 border-black pb-2">
            <span className="text-xs uppercase text-[var(--ink-soft)]">
              #{player.jerseyNumber} · {t(POSITION_LABEL_KEYS[player.position])}
            </span>
            <span className="block text-lg font-black uppercase leading-tight">{player.displayName}</span>
          </span>

          <span className="grid grid-cols-3 gap-2 text-center text-xs font-bold uppercase">
            <span className="pixel-stat">
              <strong>{stats.serveSuccess}</strong>
              <small>{t("flip.servePlus")}</small>
            </span>
            <span className="pixel-stat">
              <strong>{stats.spikeSuccess}</strong>
              <small>{t("flip.spikePlus")}</small>
            </span>
            <span className="pixel-stat">
              <strong>{stats.errors}</strong>
              <small>{t("flip.errors")}</small>
            </span>
          </span>
        </span>

        <span className="card-face card-back">
          <span className="mb-2 block text-sm font-black uppercase">{t("flip.detailStats")}</span>
          <span className="grid grid-cols-2 gap-1 text-xs">
            <span>{t("flip.servePlus")}: {stats.serveSuccess}</span>
            <span>{t("flip.receivePlus")}: {stats.receiveSuccess}</span>
            <span>{t("flip.spikePlus")}: {stats.spikeSuccess}</span>
            <span>{t("flip.blockPlus")}: {stats.blockSuccess}</span>
            <span>{t("flip.total")}: {stats.totalEvents}</span>
            <span>{t("flip.errors")}: {stats.errors}</span>
          </span>
          <span className="mt-2 block border-t-2 border-black pt-2 text-xs">
            {t("flip.tip")}: {insight.tip}
          </span>
          <span className="mt-2 block text-xs">
            {insight.missions.map((mission) => (
              <span className="block" key={mission}>
                - {mission}
              </span>
            ))}
          </span>
        </span>
      </span>
    </button>
  );
}
