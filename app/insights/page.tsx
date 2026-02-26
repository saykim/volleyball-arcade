"use client";

import { useEffect, useMemo, useState } from "react";

import { TeamSelector } from "@/components/team-selector";
import { listEventsForTeam, listPlayers, listSessions, listTeams } from "@/lib/db";
import type { Player, Session, StatEvent, Team } from "@/lib/domain";
import { useI18n } from "@/lib/i18n";
import { buildPlayerInsight, computePlayerStats, summarizeTeam } from "@/lib/stats";

const POSITION_LABEL_KEYS = {
  setter: "position.setter",
  outside: "position.outside",
  middle: "position.middle",
  opposite: "position.opposite",
  libero: "position.libero",
} as const;

export default function InsightsPage() {
  const { t } = useI18n();

  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<StatEvent[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  useEffect(() => {
    void listTeams().then((nextTeams) => {
      setTeams(nextTeams);
      setSelectedTeamId(nextTeams[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (selectedTeamId === null) return;
    void Promise.all([
      listPlayers(selectedTeamId),
      listSessions(selectedTeamId),
      listEventsForTeam(selectedTeamId),
    ]).then(([nextPlayers, nextSessions, nextEvents]) => {
      setPlayers(nextPlayers);
      setSessions(nextSessions);
      setEvents(nextEvents);
    });
  }, [selectedTeamId]);

  const teamSummary = useMemo(() => summarizeTeam(events), [events]);

  return (
    <section className="space-y-4">
      <div className="pixel-panel space-y-3">
        <h2 className="text-lg font-black uppercase">{t("insights.title")}</h2>
        <TeamSelector teams={teams} teamId={selectedTeamId} onChange={setSelectedTeamId} />

        <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold uppercase">
          <div className="pixel-stat">
            <strong>{sessions.length}</strong>
            <small>{t("insights.sessions")}</small>
          </div>
          <div className="pixel-stat">
            <strong>{teamSummary.positiveEvents}</strong>
            <small>{t("insights.positive")}</small>
          </div>
          <div className="pixel-stat">
            <strong>{teamSummary.totalErrors}</strong>
            <small>{t("insights.errors")}</small>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {players.map((player) => {
          if (!player.id) return null;
          const stats = computePlayerStats(events.filter((event) => event.playerId === player.id));
          const insight = buildPlayerInsight(stats, t);

          return (
            <article className="pixel-panel space-y-2" key={player.id}>
              <header className="flex items-center justify-between">
                <h3 className="text-base font-black uppercase">
                  #{player.jerseyNumber} {player.displayName}
                </h3>
                <span className="tag">{t(POSITION_LABEL_KEYS[player.position])}</span>
              </header>
              <p className="text-sm">
                <strong>{t("insights.strength")}:</strong> {insight.strengths[0]}
              </p>
              <p className="text-sm">
                <strong>{t("insights.focus")}:</strong> {insight.weaknesses[0]}
              </p>
              <p className="text-sm">
                <strong>{t("insights.tip")}:</strong> {insight.tip}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
