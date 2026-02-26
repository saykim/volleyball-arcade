import type { PlayerInsight, PlayerStats, StatEvent } from "@/lib/domain";

export const EMPTY_PLAYER_STATS: PlayerStats = {
  serveSuccess: 0,
  receiveSuccess: 0,
  spikeSuccess: 0,
  blockSuccess: 0,
  errors: 0,
  totalEvents: 0,
};

export function computePlayerStats(events: StatEvent[]): PlayerStats {
  return events.reduce<PlayerStats>((acc, event) => {
    acc.totalEvents += 1;

    if (event.type === "error" || event.outcome === "error") {
      acc.errors += 1;
    }

    if (event.outcome === "success") {
      if (event.type === "serve") acc.serveSuccess += 1;
      if (event.type === "receive") acc.receiveSuccess += 1;
      if (event.type === "spike") acc.spikeSuccess += 1;
      if (event.type === "block") acc.blockSuccess += 1;
    }

    return acc;
  }, { ...EMPTY_PLAYER_STATS });
}

type InsightMessageKey =
  | "insight.strength.servingPressure"
  | "insight.strength.firstTouch"
  | "insight.strength.attackChoices"
  | "insight.strength.netTiming"
  | "insight.strength.default"
  | "insight.weakness.errors"
  | "insight.weakness.receive"
  | "insight.weakness.spike"
  | "insight.weakness.default"
  | "insight.tip.default"
  | "insight.tip.errors"
  | "insight.tip.spike"
  | "insight.tip.receive"
  | "insight.mission.errors"
  | "insight.mission.calls"
  | "insight.mission.target"
  | "insight.mission.controlled";

type Translate = (key: InsightMessageKey) => string;

function labelStrengths(stats: PlayerStats, t: Translate): string[] {
  const strengths: string[] = [];

  if (stats.serveSuccess >= 4) strengths.push(t("insight.strength.servingPressure"));
  if (stats.receiveSuccess >= 5) strengths.push(t("insight.strength.firstTouch"));
  if (stats.spikeSuccess >= 4) strengths.push(t("insight.strength.attackChoices"));
  if (stats.blockSuccess >= 3) strengths.push(t("insight.strength.netTiming"));

  if (strengths.length === 0) {
    strengths.push(t("insight.strength.default"));
  }

  return strengths;
}

function labelWeaknesses(stats: PlayerStats, t: Translate): string[] {
  const weaknesses: string[] = [];

  if (stats.errors >= 4) weaknesses.push(t("insight.weakness.errors"));
  if (stats.receiveSuccess === 0 && stats.totalEvents > 0) {
    weaknesses.push(t("insight.weakness.receive"));
  }
  if (stats.spikeSuccess === 0 && stats.totalEvents >= 4) {
    weaknesses.push(t("insight.weakness.spike"));
  }

  if (weaknesses.length === 0) {
    weaknesses.push(t("insight.weakness.default"));
  }

  return weaknesses;
}

export function buildPlayerInsight(stats: PlayerStats, t: Translate): PlayerInsight {
  const strengths = labelStrengths(stats, t);
  const weaknesses = labelWeaknesses(stats, t);

  let tip = t("insight.tip.default");
  if (stats.errors >= 4) {
    tip = t("insight.tip.errors");
  } else if (stats.spikeSuccess >= 4) {
    tip = t("insight.tip.spike");
  } else if (stats.receiveSuccess >= 5) {
    tip = t("insight.tip.receive");
  }

  const missions = [
    stats.errors >= 3 ? t("insight.mission.errors") : t("insight.mission.calls"),
    stats.serveSuccess >= 3
      ? t("insight.mission.target")
      : t("insight.mission.controlled"),
  ];

  return { strengths, weaknesses, tip, missions };
}

export function summarizeTeam(events: StatEvent[]) {
  return {
    totalEvents: events.length,
    positiveEvents: events.filter((event) => event.outcome === "success").length,
    totalErrors: events.filter((event) => event.outcome === "error" || event.type === "error").length,
  };
}
