"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { PlayerFlipCard } from "@/components/player-flip-card";
import { TeamSelector } from "@/components/team-selector";
import { PLAYER_POSITIONS } from "@/lib/constants";
import {
  createPlayer,
  createTeam,
  listEventsForSession,
  listEventsForTeam,
  listPlayers,
  listSessions,
  listTeams,
  requestPersistentStorage,
} from "@/lib/db";
import type { Player, PlayerStats, Session, StatEvent, Team } from "@/lib/domain";
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

interface PlayerDraft {
  displayName: string;
  jerseyNumber: string;
  position: Player["position"];
}

const EMPTY_PLAYER_DRAFT: PlayerDraft = {
  displayName: "",
  jerseyNumber: "",
  position: "outside",
};

export default function TeamPage() {
  const { t } = useI18n();

  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<StatEvent[]>([]);

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | "all">("all");

  const [teamName, setTeamName] = useState("");
  const [playerDraft, setPlayerDraft] = useState<PlayerDraft>(EMPTY_PLAYER_DRAFT);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  const refreshTeams = useCallback(async () => {
    const nextTeams = await listTeams();
    setTeams(nextTeams);
    const fallbackTeamId = nextTeams[0]?.id ?? null;

    setSelectedTeamId((current) => {
      if (current && nextTeams.some((team) => team.id === current)) {
        return current;
      }
      return fallbackTeamId;
    });
  }, []);

  const refreshTeamData = useCallback(
    async (teamId: number) => {
      const [nextPlayers, nextSessions] = await Promise.all([listPlayers(teamId), listSessions(teamId)]);
      setPlayers(nextPlayers);
      setSessions(nextSessions);

      if (selectedSessionId !== "all" && !nextSessions.some((session) => session.id === selectedSessionId)) {
        setSelectedSessionId("all");
        const allEvents = await listEventsForTeam(teamId);
        setEvents(allEvents);
        return;
      }

      if (selectedSessionId === "all") {
        const allEvents = await listEventsForTeam(teamId);
        setEvents(allEvents);
        return;
      }

      const scopedEvents = await listEventsForSession(selectedSessionId);
      setEvents(scopedEvents);
    },
    [selectedSessionId],
  );

  useEffect(() => {
    requestPersistentStorage().catch(() => undefined);
    queueMicrotask(() => {
      void refreshTeams();
    });
  }, [refreshTeams]);

  useEffect(() => {
    if (selectedTeamId !== null) {
      queueMicrotask(() => {
        void refreshTeamData(selectedTeamId);
      });
    }
  }, [refreshTeamData, selectedTeamId]);

  useEffect(() => {
    if (selectedTeamId === null) {
      return;
    }

    if (selectedSessionId === "all") {
      void listEventsForTeam(selectedTeamId).then(setEvents);
      return;
    }

    void listEventsForSession(selectedSessionId).then(setEvents);
  }, [selectedSessionId, selectedTeamId]);

  const statsByPlayer = useMemo(() => {
    const map = new Map<number, PlayerStats>();
    players.forEach((player) => {
      if (!player.id) {
        return;
      }
      const playerEvents = events.filter((event) => event.playerId === player.id);
      map.set(player.id, computePlayerStats(playerEvents));
    });
    return map;
  }, [events, players]);

  async function handleCreateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!teamName.trim()) return;
    await createTeam(teamName);
    setTeamName("");
    await refreshTeams();
  }

  async function handleCreatePlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedTeamId === null) return;

    await createPlayer({
      teamId: selectedTeamId,
      displayName: playerDraft.displayName,
      jerseyNumber: Number(playerDraft.jerseyNumber),
      position: playerDraft.position,
    });

    setPlayerDraft(EMPTY_PLAYER_DRAFT);
    await refreshTeamData(selectedTeamId);
  }

  return (
    <section className="space-y-4">
      <div className="pixel-panel space-y-3">
        <h2 className="text-lg font-black uppercase">{t("team.title")}</h2>

        <form className="flex gap-2" onSubmit={handleCreateTeam}>
          <input
            className="pixel-input"
            placeholder={t("team.newTeamPlaceholder")}
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
          />
          <button className="pixel-btn" type="submit">
            {t("team.add")}
          </button>
        </form>

        <TeamSelector
          teams={teams}
          teamId={selectedTeamId}
          onChange={(nextTeamId) => {
            setSelectedTeamId(nextTeamId);
            setSelectedSessionId("all");
            setFlipped(new Set());
          }}
        />

        <form className="grid grid-cols-1 gap-2 sm:grid-cols-4" onSubmit={handleCreatePlayer}>
          <input
            className="pixel-input sm:col-span-2"
            placeholder={t("team.playerNamePlaceholder")}
            value={playerDraft.displayName}
            onChange={(event) => setPlayerDraft((prev) => ({ ...prev, displayName: event.target.value }))}
            required
          />
          <input
            className="pixel-input"
            placeholder={t("team.jerseyPlaceholder")}
            type="number"
            value={playerDraft.jerseyNumber}
            onChange={(event) => setPlayerDraft((prev) => ({ ...prev, jerseyNumber: event.target.value }))}
            required
          />
          <select
            className="pixel-input"
            value={playerDraft.position}
            onChange={(event) =>
              setPlayerDraft((prev) => ({ ...prev, position: event.target.value as Player["position"] }))
            }
          >
            {PLAYER_POSITIONS.map((position) => (
              <option key={position} value={position}>
                {t(POSITION_LABEL_KEYS[position])}
              </option>
            ))}
          </select>
          <button className="pixel-btn sm:col-span-4" type="submit" disabled={selectedTeamId === null}>
            {t("team.addPlayer")}
          </button>
        </form>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t("team.sessionScopeLabel")}
          <select
            className="pixel-input"
            value={selectedSessionId}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedSessionId(value === "all" ? "all" : Number(value));
            }}
          >
            <option value="all">{t("team.sessionScopeAll")}</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.date} · {t(SESSION_KIND_LABEL_KEYS[session.kind])}
                {session.opponent ? ` · ${session.opponent}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {players.map((player) => {
          if (!player.id) return null;
          const playerStats = statsByPlayer.get(player.id) ?? EMPTY_PLAYER_STATS;
          const insight = buildPlayerInsight(playerStats, t);

          return (
            <PlayerFlipCard
              key={player.id}
              player={player}
              stats={playerStats}
              insight={insight}
              flipped={flipped.has(player.id)}
              onToggle={() => {
                setFlipped((prev) => {
                  const next = new Set(prev);
                  if (next.has(player.id!)) {
                    next.delete(player.id!);
                  } else {
                    next.add(player.id!);
                  }
                  return next;
                });
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
