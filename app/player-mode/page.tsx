"use client";

import { useEffect, useMemo, useState } from "react";

import { TeamSelector } from "@/components/team-selector";
import { listEventsForSession, listPlayers, listSessions, listTeams } from "@/lib/db";
import type { Player, Session, StatEvent, Team } from "@/lib/domain";
import { useI18n } from "@/lib/i18n";
import { buildPlayerInsight, computePlayerStats, EMPTY_PLAYER_STATS } from "@/lib/stats";

const POSITION_LABEL_KEYS = {
  setter: "position.setter",
  outside: "position.outside",
  middle: "position.middle",
  opposite: "position.opposite",
  libero: "position.libero",
} as const;

const SESSION_KIND_LABEL_KEYS = {
  match: "sessionKind.match",
  practice: "sessionKind.practice",
} as const;

export default function PlayerModePage() {
  const { t } = useI18n();

  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<StatEvent[]>([]);

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  useEffect(() => {
    void listTeams().then((nextTeams) => {
      setTeams(nextTeams);
      setSelectedTeamId(nextTeams[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (selectedTeamId === null) return;
    void Promise.all([listPlayers(selectedTeamId), listSessions(selectedTeamId)]).then(
      ([nextPlayers, nextSessions]) => {
        setPlayers(nextPlayers);
        setSessions(nextSessions);
        setSelectedPlayerId(nextPlayers[0]?.id ?? null);
        setSelectedSessionId(nextSessions[0]?.id ?? null);
      },
    );
  }, [selectedTeamId]);

  useEffect(() => {
    if (selectedSessionId === null) return;

    void listEventsForSession(selectedSessionId).then(setEvents);
  }, [selectedSessionId]);

  const activePlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId],
  );
  const activeStats = useMemo(() => {
    if (!selectedPlayerId) return EMPTY_PLAYER_STATS;
    return computePlayerStats(events.filter((event) => event.playerId === selectedPlayerId));
  }, [events, selectedPlayerId]);
  const activeInsight = useMemo(() => buildPlayerInsight(activeStats, t), [activeStats, t]);

  return (
    <section className="space-y-3">
      <div className="pixel-panel space-y-3">
        <h2 className="text-lg font-black uppercase">{t("playerMode.title")}</h2>
        <TeamSelector teams={teams} teamId={selectedTeamId} onChange={setSelectedTeamId} />

        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t("playerMode.session")}
          <select
            className="pixel-input"
            value={selectedSessionId ?? ""}
            onChange={(event) => setSelectedSessionId(Number(event.target.value) || null)}
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.date} · {t(SESSION_KIND_LABEL_KEYS[session.kind])}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t("playerMode.player")}
          <select
            className="pixel-input"
            value={selectedPlayerId ?? ""}
            onChange={(event) => setSelectedPlayerId(Number(event.target.value) || null)}
          >
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                #{player.jerseyNumber} {player.displayName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="pixel-panel space-y-2 text-center">
        <h3 className="text-2xl font-black uppercase">{activePlayer?.displayName ?? t("playerMode.noPlayer")}</h3>
        <p className="text-sm uppercase tracking-wider">
          #{activePlayer?.jerseyNumber} · {activePlayer ? t(POSITION_LABEL_KEYS[activePlayer.position]) : "-"}
        </p>

        <div className="grid grid-cols-2 gap-2 text-xl font-black">
          <div className="border-4 border-black bg-white p-3">{t("playerMode.servePlus")} {activeStats.serveSuccess}</div>
          <div className="border-4 border-black bg-white p-3">{t("playerMode.spikePlus")} {activeStats.spikeSuccess}</div>
          <div className="border-4 border-black bg-white p-3">{t("playerMode.receivePlus")} {activeStats.receiveSuccess}</div>
          <div className="border-4 border-black bg-white p-3">{t("playerMode.errors")} {activeStats.errors}</div>
        </div>

        <p className="border-4 border-black bg-white p-3 text-base font-bold">{t("playerMode.tip")}: {activeInsight.tip}</p>
        <div className="border-4 border-black bg-white p-3 text-left text-base font-bold">
          {activeInsight.missions.map((mission) => (
            <p key={mission}>- {mission}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
