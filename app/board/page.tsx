"use client";

import { useEffect, useMemo, useState } from "react";

import { assignPlayerToSlot, BOARD_SLOT_COUNT, removePlayerFromSlot } from "@/lib/board";
import { getBoardState, listPlayers, listSessions, listTeams, resetBoardState, upsertBoardState } from "@/lib/db";
import type { Player, Session, Team } from "@/lib/domain";
import { useI18n } from "@/lib/i18n";
import { confirmBoardReset, getStoredRole, hasPermission } from "@/lib/permissions";

const SESSION_KIND_LABEL_KEYS = {
  match: "sessionKind.match",
  practice: "sessionKind.practice",
} as const;

export default function BoardPage() {
  const { t } = useI18n();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Array<number | null>>(() => Array.from({ length: BOARD_SLOT_COUNT }, () => null));
  const [armedPlayerId, setArmedPlayerId] = useState<number | null>(null);

  useEffect(() => {
    void listTeams().then((nextTeams) => {
      setTeams(nextTeams);
      setSelectedTeamId(nextTeams[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (selectedTeamId === null) {
      return;
    }

    void Promise.all([listPlayers(selectedTeamId), listSessions(selectedTeamId)]).then(([nextPlayers, nextSessions]) => {
      setPlayers(nextPlayers);
      setSessions(nextSessions);
      setSelectedSessionId((current) => {
        if (current && nextSessions.some((session) => session.id === current)) {
          return current;
        }
        return nextSessions[0]?.id ?? null;
      });
    });
  }, [selectedTeamId]);

  useEffect(() => {
    if (!selectedTeamId || !selectedSessionId) {
      return;
    }

    void getBoardState(selectedTeamId, selectedSessionId).then((state) => {
      setAssignments(state.assignments);
      setArmedPlayerId(null);
    });
  }, [selectedTeamId, selectedSessionId]);

  const assignedIds = useMemo(() => new Set(assignments.filter((value): value is number => typeof value === "number")), [assignments]);
  const unassignedPlayers = useMemo(() => players.filter((player) => (player.id ? !assignedIds.has(player.id) : true)), [assignedIds, players]);
  const role = useMemo(() => getStoredRole(), []);
  const canResetBoard = hasPermission(role, "board.reset");

  function findPlayer(playerId: number | null): Player | undefined {
    return players.find((player) => player.id === playerId);
  }

  async function persist(nextAssignments: Array<number | null>): Promise<void> {
    if (!selectedTeamId || !selectedSessionId) {
      return;
    }

    setAssignments(nextAssignments);
    await upsertBoardState({
      teamId: selectedTeamId,
      sessionId: selectedSessionId,
      assignments: nextAssignments,
    });
  }

  async function assign(slotIndex: number, playerId: number): Promise<void> {
    await persist(assignPlayerToSlot(assignments, slotIndex, playerId));
    setArmedPlayerId(null);
  }

  return (
    <section className="space-y-4">
      <div className="pixel-panel space-y-3">
        <h2 className="text-lg font-black uppercase">{t("board.title")}</h2>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t("board.team")}
          <select
            className="pixel-input"
            value={selectedTeamId ?? ""}
            onChange={(event) => {
              setSelectedTeamId(Number(event.target.value) || null);
              setSelectedSessionId(null);
              setAssignments(Array.from({ length: BOARD_SLOT_COUNT }, () => null));
              setArmedPlayerId(null);
            }}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t("board.session")}
          <select
            className="pixel-input"
            value={selectedSessionId ?? ""}
            onChange={(event) => {
              setSelectedSessionId(Number(event.target.value) || null);
              setAssignments(Array.from({ length: BOARD_SLOT_COUNT }, () => null));
              setArmedPlayerId(null);
            }}
            disabled={sessions.length === 0}
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.date} · {t(SESSION_KIND_LABEL_KEYS[session.kind])}
              </option>
            ))}
          </select>
        </label>

        {sessions.length === 0 ? <p className="text-sm">{t("board.emptySessions")}</p> : null}

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="tag">{t("board.dragHint")}</span>
          <span className="tag">{t("board.tapHint")}</span>
        </div>

        {armedPlayerId ? (
          <p className="text-xs font-semibold">
            {(() => {
              const player = findPlayer(armedPlayerId);
              if (!player) {
                return null;
              }
              return t("board.armedHint", { jersey: player.jerseyNumber, name: player.displayName });
            })()}
          </p>
        ) : null}
      </div>

      <div className="pixel-panel space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black uppercase">{t("board.rosterTitle")}</h3>
          <button
            className="pixel-btn"
            type="button"
            disabled={!selectedTeamId || !selectedSessionId || !canResetBoard}
            onClick={async () => {
              if (!selectedTeamId || !selectedSessionId) {
                return;
              }
              const approved = confirmBoardReset({
                role,
                message: t("board.resetConfirm"),
                confirm: (message) => window.confirm(message),
              });
              if (!approved) {
                return;
              }
              await resetBoardState(selectedTeamId, selectedSessionId);
              setAssignments(Array.from({ length: BOARD_SLOT_COUNT }, () => null));
              setArmedPlayerId(null);
            }}
          >
            {t("board.reset")}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {unassignedPlayers.map((player) => (
            <button
              key={player.id}
              type="button"
              draggable={Boolean(player.id && selectedSessionId && selectedTeamId)}
              onDragStart={(event) => {
                if (!player.id) {
                  return;
                }
                event.dataTransfer.setData("text/plain", String(player.id));
              }}
              onClick={() => {
                const playerId = player.id;
                if (!playerId) {
                  return;
                }
                setArmedPlayerId((current) => (current === playerId ? null : playerId));
              }}
              className={`border-2 border-black px-2 py-1 text-xs font-black ${armedPlayerId === player.id ? "bg-[var(--accent)]" : "bg-white"}`}
            >
              #{player.jerseyNumber} {player.displayName}
            </button>
          ))}
          {unassignedPlayers.length === 0 ? <p className="text-sm">{t("board.unassigned")}: 0</p> : null}
        </div>
      </div>

      <div className="pixel-panel space-y-3">
        <h3 className="text-base font-black uppercase">{t("board.courtTitle")}</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {assignments.map((playerId, slotIndex) => {
            const player = findPlayer(playerId);

            return (
              <button
                key={slotIndex}
                type="button"
                className="min-h-24 border-4 border-black bg-white p-2 text-left"
                onDragOver={(event) => event.preventDefault()}
                onDrop={async (event) => {
                  if (!selectedSessionId || !selectedTeamId) {
                    return;
                  }
                  const raw = event.dataTransfer.getData("text/plain");
                  const droppedPlayerId = Number(raw);
                  if (!Number.isInteger(droppedPlayerId) || droppedPlayerId <= 0) {
                    return;
                  }
                  await assign(slotIndex, droppedPlayerId);
                }}
                onClick={async () => {
                  if (armedPlayerId) {
                    await assign(slotIndex, armedPlayerId);
                    return;
                  }

                  if (playerId !== null) {
                    await persist(removePlayerFromSlot(assignments, slotIndex));
                  }
                }}
              >
                <p className="text-xs font-black uppercase">{t("board.slot", { slot: slotIndex + 1 })}</p>
                {player ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm font-bold">#{player.jerseyNumber} {player.displayName}</p>
                    <span className="inline-block border-2 border-black bg-[var(--panel-soft)] px-2 py-1 text-[11px] font-bold uppercase">
                      {t("board.remove")}
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{t("board.unassigned")}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
