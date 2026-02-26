"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import { TeamSelector } from "@/components/team-selector";
import { EVENT_OUTCOMES, EVENT_TYPES, SESSION_KINDS } from "@/lib/constants";
import {
  createEvent,
  createSession,
  deleteEvent,
  deleteSession,
  listEventsForSession,
  listPlayers,
  listSessions,
  listTeams,
  updateEvent,
  updateSession,
} from "@/lib/db";
import type { Player, Session, StatEvent, Team } from "@/lib/domain";
import { useI18n } from "@/lib/i18n";

const SESSION_KIND_LABEL_KEYS = {
  match: "sessionKind.match",
  practice: "sessionKind.practice",
} as const;

const EVENT_TYPE_LABEL_KEYS = {
  serve: "eventType.serve",
  receive: "eventType.receive",
  spike: "eventType.spike",
  block: "eventType.block",
  error: "eventType.error",
} as const;

const EVENT_OUTCOME_LABEL_KEYS = {
  success: "eventOutcome.success",
  error: "eventOutcome.error",
} as const;

interface SessionDraft {
  kind: Session["kind"];
  date: string;
  opponent: string;
  scoreUs: string;
  scoreThem: string;
  setScores: string;
  notes: string;
}

interface EventDraft {
  playerId: string;
  type: StatEvent["type"];
  outcome: StatEvent["outcome"];
  note: string;
}

const EMPTY_SESSION_DRAFT: SessionDraft = {
  kind: "match",
  date: new Date().toISOString().slice(0, 10),
  opponent: "",
  scoreUs: "",
  scoreThem: "",
  setScores: "",
  notes: "",
};

const EMPTY_EVENT_DRAFT: EventDraft = {
  playerId: "",
  type: "serve",
  outcome: "success",
  note: "",
};

export default function SessionsPage() {
  const { t } = useI18n();

  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<StatEvent[]>([]);

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);

  const [sessionDraft, setSessionDraft] = useState<SessionDraft>(EMPTY_SESSION_DRAFT);
  const [eventDraft, setEventDraft] = useState<EventDraft>(EMPTY_EVENT_DRAFT);

  const refreshTeams = useCallback(async () => {
    const nextTeams = await listTeams();
    setTeams(nextTeams);
    setSelectedTeamId((current) => {
      if (current && nextTeams.some((team) => team.id === current)) {
        return current;
      }
      return nextTeams[0]?.id ?? null;
    });
  }, []);

  const refreshTeamData = useCallback(async (teamId: number) => {
    const [nextPlayers, nextSessions] = await Promise.all([listPlayers(teamId), listSessions(teamId)]);
    setPlayers(nextPlayers);
    setSessions(nextSessions);

    const defaultSessionId = nextSessions[0]?.id ?? null;
    setSelectedSessionId((current) => {
      if (current && nextSessions.some((session) => session.id === current)) {
        return current;
      }
      return defaultSessionId;
    });

    setEventDraft((prev) => ({
      ...prev,
      playerId: nextPlayers[0]?.id ? String(nextPlayers[0].id) : "",
    }));
  }, []);

  useEffect(() => {
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
    if (selectedSessionId !== null) {
      void listEventsForSession(selectedSessionId).then(setEvents);
      return;
    }

    queueMicrotask(() => {
      setEvents([]);
    });
  }, [selectedSessionId]);

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedTeamId === null) return;

    const sessionId = await createSession({
      teamId: selectedTeamId,
      kind: sessionDraft.kind,
      date: sessionDraft.date,
      opponent: sessionDraft.opponent,
      scoreUs: sessionDraft.scoreUs.trim() ? Number(sessionDraft.scoreUs) : undefined,
      scoreThem: sessionDraft.scoreThem.trim() ? Number(sessionDraft.scoreThem) : undefined,
      setScores: sessionDraft.setScores,
      notes: sessionDraft.notes,
    });

    setSessionDraft(EMPTY_SESSION_DRAFT);
    await refreshTeamData(selectedTeamId);
    setSelectedSessionId(sessionId);
  }

  async function handleSaveSession(sessionId: number, original: Session) {
    await updateSession(sessionId, {
      kind: original.kind,
      date: original.date,
      opponent: original.opponent,
      scoreUs: original.scoreUs,
      scoreThem: original.scoreThem,
      setScores: original.setScores,
      notes: original.notes,
    });
    if (selectedTeamId !== null) {
      await refreshTeamData(selectedTeamId);
    }
  }

  async function handleCreateOrUpdateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedTeamId === null || selectedSessionId === null || !eventDraft.playerId) return;

    if (editingEventId) {
      await updateEvent(editingEventId, {
        playerId: Number(eventDraft.playerId),
        type: eventDraft.type,
        outcome: eventDraft.outcome,
        note: eventDraft.note,
      });
      setEditingEventId(null);
    } else {
      await createEvent({
        teamId: selectedTeamId,
        sessionId: selectedSessionId,
        playerId: Number(eventDraft.playerId),
        type: eventDraft.type,
        outcome: eventDraft.outcome,
        note: eventDraft.note,
      });
    }

    setEventDraft((prev) => ({ ...EMPTY_EVENT_DRAFT, playerId: prev.playerId }));
    const nextEvents = await listEventsForSession(selectedSessionId);
    setEvents(nextEvents);
  }

  return (
    <section className="space-y-4">
      <div className="pixel-panel space-y-3">
        <h2 className="text-lg font-black uppercase">{t("sessions.title")}</h2>
        <TeamSelector
          teams={teams}
          teamId={selectedTeamId}
          onChange={(teamId) => {
            setSelectedTeamId(teamId);
            setEditingEventId(null);
            setEventDraft(EMPTY_EVENT_DRAFT);
          }}
        />

        <form className="grid grid-cols-1 gap-2 sm:grid-cols-2" onSubmit={handleCreateSession}>
          <select
            className="pixel-input"
            value={sessionDraft.kind}
            onChange={(event) =>
              setSessionDraft((prev) => ({ ...prev, kind: event.target.value as Session["kind"] }))
            }
          >
            {SESSION_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {t(SESSION_KIND_LABEL_KEYS[kind])}
              </option>
            ))}
          </select>
          <input
            className="pixel-input"
            type="date"
            value={sessionDraft.date}
            onChange={(event) => setSessionDraft((prev) => ({ ...prev, date: event.target.value }))}
          />
          <input
            className="pixel-input"
            placeholder={t("sessions.opponentPlaceholder")}
            value={sessionDraft.opponent}
            onChange={(event) => setSessionDraft((prev) => ({ ...prev, opponent: event.target.value }))}
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              className="pixel-input"
              placeholder={t("sessions.usScorePlaceholder")}
              inputMode="numeric"
              value={sessionDraft.scoreUs}
              onChange={(event) => setSessionDraft((prev) => ({ ...prev, scoreUs: event.target.value }))}
            />
            <input
              className="pixel-input"
              placeholder={t("sessions.themScorePlaceholder")}
              inputMode="numeric"
              value={sessionDraft.scoreThem}
              onChange={(event) => setSessionDraft((prev) => ({ ...prev, scoreThem: event.target.value }))}
            />
          </div>

          <input
            className="pixel-input sm:col-span-2"
            placeholder={t("sessions.setScoresPlaceholder")}
            value={sessionDraft.setScores}
            onChange={(event) => setSessionDraft((prev) => ({ ...prev, setScores: event.target.value }))}
          />

          <input
            className="pixel-input sm:col-span-2"
            placeholder={t("sessions.notesPlaceholder")}
            value={sessionDraft.notes}
            onChange={(event) => setSessionDraft((prev) => ({ ...prev, notes: event.target.value }))}
          />
          <button className="pixel-btn sm:col-span-2" type="submit" disabled={selectedTeamId === null}>
            {t("sessions.create")}
          </button>
        </form>

        <div className="space-y-2">
          {sessions.map((session) => (
            <div className="border-2 border-black bg-white p-2" key={session.id}>
              <button
                type="button"
                className="w-full text-left text-sm font-bold"
                onClick={() => {
                  setSelectedSessionId(session.id ?? null);
                  setEditingEventId(null);
                  setEventDraft((prev) => ({ ...EMPTY_EVENT_DRAFT, playerId: prev.playerId }));
                }}
              >
                {session.date} · {t(SESSION_KIND_LABEL_KEYS[session.kind])}
                {session.opponent ? ` · ${session.opponent}` : ""}
                {typeof session.scoreUs === "number" && typeof session.scoreThem === "number"
                  ? ` · ${session.scoreUs}-${session.scoreThem}`
                  : ""}
              </button>
              <div className="mt-2 flex gap-2">
                <button
                  className="pixel-btn"
                  type="button"
                  onClick={() => {
                    const nextNotes = window.prompt(t("sessions.promptUpdateNotes"), session.notes ?? "");
                    if (nextNotes === null || !session.id) return;
                    void handleSaveSession(session.id, { ...session, notes: nextNotes });
                  }}
                >
                  {t("sessions.editNotes")}
                </button>
                <button
                  className="pixel-btn"
                  type="button"
                  onClick={() => {
                    if (!session.id) return;
                    const nextScore = window.prompt(
                      t("sessions.promptUpdateScore"),
                      typeof session.scoreUs === "number" && typeof session.scoreThem === "number"
                        ? `${session.scoreUs}-${session.scoreThem}`
                        : "",
                    );
                    if (nextScore === null) return;

                    const trimmed = nextScore.trim();
                    if (!trimmed) {
                      void handleSaveSession(session.id, { ...session, scoreUs: undefined, scoreThem: undefined });
                      return;
                    }

                    const match = trimmed.match(/^(\d{1,3})\s*-\s*(\d{1,3})$/);
                    if (!match) {
                      window.alert(t("sessions.invalidScore"));
                      return;
                    }

                    void handleSaveSession(session.id, {
                      ...session,
                      scoreUs: Number(match[1]),
                      scoreThem: Number(match[2]),
                    });
                  }}
                >
                  {t("sessions.score")}
                </button>
                <button
                  className="pixel-btn"
                  type="button"
                  onClick={() => {
                    if (!session.id) return;
                    const nextSetScores = window.prompt(
                      t("sessions.promptUpdateSets"),
                      session.setScores ?? "",
                    );
                    if (nextSetScores === null) return;
                    void handleSaveSession(session.id, { ...session, setScores: nextSetScores });
                  }}
                >
                  {t("sessions.sets")}
                </button>
                <button
                  className="pixel-btn"
                  type="button"
                  onClick={async () => {
                    if (!session.id) return;
                    await deleteSession(session.id);
                    if (selectedTeamId !== null) {
                      await refreshTeamData(selectedTeamId);
                    }
                  }}
                >
                  {t("sessions.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pixel-panel space-y-3">
        <h3 className="text-lg font-black uppercase">{t("sessions.eventsTitle")}</h3>
        <p className="text-xs">
          {t("sessions.selectedSession")}: {sessions.find((session) => session.id === selectedSessionId)?.date ?? t("sessions.none")}
        </p>

        <form className="grid grid-cols-1 gap-2 sm:grid-cols-4" onSubmit={handleCreateOrUpdateEvent}>
          <select
            className="pixel-input"
            value={eventDraft.playerId}
            onChange={(event) => setEventDraft((prev) => ({ ...prev, playerId: event.target.value }))}
            required
          >
            <option value="">{t("sessions.selectPlayer")}</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                #{player.jerseyNumber} {player.displayName}
              </option>
            ))}
          </select>

          <select
            className="pixel-input"
            value={eventDraft.type}
            onChange={(event) =>
              setEventDraft((prev) => ({ ...prev, type: event.target.value as StatEvent["type"] }))
            }
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(EVENT_TYPE_LABEL_KEYS[type])}
              </option>
            ))}
          </select>

          <select
            className="pixel-input"
            value={eventDraft.outcome}
            onChange={(event) =>
              setEventDraft((prev) => ({ ...prev, outcome: event.target.value as StatEvent["outcome"] }))
            }
          >
            {EVENT_OUTCOMES.map((outcome) => (
              <option key={outcome} value={outcome}>
                {t(EVENT_OUTCOME_LABEL_KEYS[outcome])}
              </option>
            ))}
          </select>

          <input
            className="pixel-input"
            placeholder={t("sessions.quickNote")}
            value={eventDraft.note}
            onChange={(event) => setEventDraft((prev) => ({ ...prev, note: event.target.value }))}
          />

          <button className="pixel-btn sm:col-span-4" type="submit" disabled={selectedSessionId === null}>
            {editingEventId ? t("sessions.updateEvent") : t("sessions.addEvent")}
          </button>
        </form>

        <div className="space-y-2">
          <h4 className="text-sm font-black uppercase">{t("sessions.quickAddTitle")}</h4>
          <p className="text-xs text-[var(--ink-soft)]">
            {t("sessions.quickAddDesc")}
          </p>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex flex-wrap items-center justify-between gap-2 border-2 border-black bg-white p-2"
              >
                <div className="text-sm font-bold">
                  #{player.jerseyNumber} {player.displayName}
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="pixel-btn"
                    disabled={selectedTeamId === null || selectedSessionId === null || !player.id}
                    onClick={async () => {
                      if (selectedTeamId === null || selectedSessionId === null || !player.id) return;
                      await createEvent({
                        teamId: selectedTeamId,
                        sessionId: selectedSessionId,
                        playerId: player.id,
                        type: "serve",
                        outcome: "success",
                      });
                      setEvents(await listEventsForSession(selectedSessionId));
                    }}
                  >
                    {t("sessions.servePlus")}
                  </button>
                  <button
                    type="button"
                    className="pixel-btn"
                    disabled={selectedTeamId === null || selectedSessionId === null || !player.id}
                    onClick={async () => {
                      if (selectedTeamId === null || selectedSessionId === null || !player.id) return;
                      await createEvent({
                        teamId: selectedTeamId,
                        sessionId: selectedSessionId,
                        playerId: player.id,
                        type: "spike",
                        outcome: "success",
                      });
                      setEvents(await listEventsForSession(selectedSessionId));
                    }}
                  >
                    {t("sessions.spikePlus")}
                  </button>
                  <button
                    type="button"
                    className="pixel-btn"
                    disabled={selectedTeamId === null || selectedSessionId === null || !player.id}
                    onClick={async () => {
                      if (selectedTeamId === null || selectedSessionId === null || !player.id) return;
                      await createEvent({
                        teamId: selectedTeamId,
                        sessionId: selectedSessionId,
                        playerId: player.id,
                        type: "error",
                        outcome: "error",
                      });
                      setEvents(await listEventsForSession(selectedSessionId));
                    }}
                  >
                    {t("sessions.errorPlus")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {events.map((eventItem) => {
            const player = players.find((item) => item.id === eventItem.playerId);
            return (
              <div key={eventItem.id} className="flex items-center justify-between border-2 border-black bg-white px-2 py-1 text-sm">
                <div>
                  <span className="font-bold">{player?.displayName ?? t("sessions.unknown")}</span> · {t(EVENT_TYPE_LABEL_KEYS[eventItem.type])} · {t(EVENT_OUTCOME_LABEL_KEYS[eventItem.outcome])}
                  {eventItem.note ? ` · ${eventItem.note}` : ""}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="pixel-btn"
                    onClick={() => {
                      if (!eventItem.id) return;
                      setEditingEventId(eventItem.id);
                      setEventDraft({
                        playerId: String(eventItem.playerId),
                        type: eventItem.type,
                        outcome: eventItem.outcome,
                        note: eventItem.note ?? "",
                      });
                    }}
                  >
                    {t("sessions.edit")}
                  </button>
                  <button
                    type="button"
                    className="pixel-btn"
                    onClick={async () => {
                      if (!eventItem.id || selectedSessionId === null) return;
                      await deleteEvent(eventItem.id);
                      const nextEvents = await listEventsForSession(selectedSessionId);
                      setEvents(nextEvents);
                    }}
                  >
                    {t("sessions.del")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
