import Dexie, { type EntityTable } from "dexie";

import { createEmptyBoardAssignments, normalizeBoardAssignments } from "@/lib/board";
import type { BoardState, Player, Session, StatEvent, Team } from "@/lib/domain";

class VolleyArcadeDB extends Dexie {
  teams!: EntityTable<Team, "id">;
  players!: EntityTable<Player, "id">;
  sessions!: EntityTable<Session, "id">;
  events!: EntityTable<StatEvent, "id">;
  boardStates!: EntityTable<BoardState, "id">;

  constructor() {
    super("volleyArcadeDB");

    this.version(1).stores({
      teams: "++id, name, createdAt",
      players: "++id, teamId, [teamId+jerseyNumber], displayName, position, createdAt",
      sessions: "++id, teamId, date, kind, createdAt",
      events: "++id, teamId, sessionId, playerId, type, outcome, createdAt",
    });

    this.version(2).stores({
      teams: "++id, name, createdAt",
      players: "++id, teamId, &[teamId+jerseyNumber], displayName, position, createdAt",
      sessions: "++id, teamId, date, kind, createdAt",
      events: "++id, teamId, sessionId, playerId, type, outcome, createdAt",
    });

    this.version(3).stores({
      teams: "++id, name, createdAt",
      players: "++id, teamId, &[teamId+jerseyNumber], displayName, position, createdAt",
      sessions: "++id, teamId, date, kind, scoreUs, scoreThem, setScores, createdAt",
      events: "++id, teamId, sessionId, playerId, type, outcome, createdAt",
    });

    this.version(4).stores({
      teams: "++id, name, createdAt",
      players: "++id, teamId, &[teamId+jerseyNumber], displayName, position, createdAt",
      sessions: "++id, teamId, date, kind, scoreUs, scoreThem, setScores, createdAt",
      events: "++id, teamId, sessionId, playerId, type, outcome, createdAt",
      boardStates: "++id, teamId, sessionId, &[teamId+sessionId], updatedAt",
    });
  }
}

export const db = new VolleyArcadeDB();

function assertNumericId(value: number | undefined, context: string): number {
  if (typeof value === "number") {
    return value;
  }

  throw new Error(`Failed to create ${context}`);
}

function assertValidJerseyNumber(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 999) {
    throw new Error("Jersey number must be an integer between 0 and 999");
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    return false;
  }

  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function createTeam(name: string): Promise<number> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Team name is required");
  }

  const id = await db.teams.add({
    name: trimmed,
    createdAt: new Date().toISOString(),
  });

  return assertNumericId(id, "team");
}

export async function listTeams(): Promise<Team[]> {
  return db.teams.orderBy("createdAt").reverse().toArray();
}

export async function createPlayer(input: {
  teamId: number;
  displayName: string;
  jerseyNumber: number;
  position: Player["position"];
}): Promise<number> {
  const name = input.displayName.trim();
  if (!name) {
    throw new Error("Player name is required");
  }

  assertValidJerseyNumber(input.jerseyNumber);

  const duplicate = await db.players
    .where("[teamId+jerseyNumber]")
    .equals([input.teamId, input.jerseyNumber])
    .first();

  if (duplicate) {
    throw new Error("Jersey number already exists for this team");
  }

  const id = await db.players.add({
    teamId: input.teamId,
    displayName: name,
    jerseyNumber: input.jerseyNumber,
    position: input.position,
    createdAt: new Date().toISOString(),
  });

  return assertNumericId(id, "player");
}

export async function listPlayers(teamId: number): Promise<Player[]> {
  return db.players.where("teamId").equals(teamId).sortBy("jerseyNumber");
}

export async function deletePlayer(playerId: number): Promise<void> {
  await db.transaction("rw", db.players, db.events, async () => {
    await db.events.where("playerId").equals(playerId).delete();
    await db.players.delete(playerId);
  });
}

export async function createSession(input: {
  teamId: number;
  kind: Session["kind"];
  date: string;
  opponent?: string;
  scoreUs?: number;
  scoreThem?: number;
  setScores?: string;
  notes?: string;
}): Promise<number> {
  const id = await db.sessions.add({
    teamId: input.teamId,
    kind: input.kind,
    date: input.date,
    opponent: input.opponent?.trim() || undefined,
    scoreUs: typeof input.scoreUs === "number" && Number.isFinite(input.scoreUs) ? input.scoreUs : undefined,
    scoreThem: typeof input.scoreThem === "number" && Number.isFinite(input.scoreThem) ? input.scoreThem : undefined,
    setScores: input.setScores?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  });

  return assertNumericId(id, "session");
}

export async function listSessions(teamId: number): Promise<Session[]> {
  const sessions = await db.sessions.where("teamId").equals(teamId).toArray();
  return sessions.sort((a, b) => b.date.localeCompare(a.date));
}

export async function updateSession(
  id: number,
  patch: Pick<Session, "date" | "opponent" | "notes" | "kind" | "scoreUs" | "scoreThem" | "setScores">,
): Promise<void> {
  await db.sessions.update(id, {
    ...patch,
    opponent: patch.opponent?.trim() || undefined,
    setScores: patch.setScores?.trim() || undefined,
    notes: patch.notes?.trim() || undefined,
  });
}

export async function deleteSession(sessionId: number): Promise<void> {
  await db.transaction("rw", db.sessions, db.events, db.boardStates, async () => {
    await db.events.where("sessionId").equals(sessionId).delete();
    await db.boardStates.where("sessionId").equals(sessionId).delete();
    await db.sessions.delete(sessionId);
  });
}

export async function createEvent(input: {
  teamId: number;
  sessionId: number;
  playerId: number;
  type: StatEvent["type"];
  outcome: StatEvent["outcome"];
  note?: string;
}): Promise<number> {
  const id = await db.transaction("rw", db.events, db.players, db.sessions, async () => {
    const session = await db.sessions.get(input.sessionId);
    const player = await db.players.get(input.playerId);

    if (!session) {
      throw new Error("Session not found");
    }
    if (!player) {
      throw new Error("Player not found");
    }
    if (session.teamId !== input.teamId || player.teamId !== input.teamId) {
      throw new Error("Team mismatch between session and player");
    }

    return db.events.add({
      teamId: session.teamId,
      sessionId: input.sessionId,
      playerId: input.playerId,
      type: input.type,
      outcome: input.outcome,
      note: input.note?.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
  });

  return assertNumericId(id, "event");
}

export async function listEventsForSession(sessionId: number): Promise<StatEvent[]> {
  const events = await db.events.where("sessionId").equals(sessionId).toArray();
  return events.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listEventsForTeam(teamId: number): Promise<StatEvent[]> {
  return db.events.where("teamId").equals(teamId).toArray();
}

export async function updateEvent(
  id: number,
  patch: Pick<StatEvent, "playerId" | "type" | "outcome" | "note">,
): Promise<void> {
  await db.transaction("rw", db.events, db.players, db.sessions, async () => {
    const event = await db.events.get(id);
    if (!event) {
      throw new Error("Event not found");
    }

    const [session, player] = await Promise.all([
      db.sessions.get(event.sessionId),
      db.players.get(patch.playerId),
    ]);

    if (!session) {
      throw new Error("Session not found");
    }

    if (!player || player.teamId !== session.teamId) {
      throw new Error("Player is not on the session team");
    }

    await db.events.update(id, {
      playerId: patch.playerId,
      teamId: session.teamId,
      type: patch.type,
      outcome: patch.outcome,
      note: patch.note?.trim() || undefined,
    });
  });
}

export async function deleteEvent(eventId: number): Promise<void> {
  await db.events.delete(eventId);
}

export async function getBoardState(teamId: number, sessionId: number): Promise<BoardState> {
  const existing = await db.boardStates.where("[teamId+sessionId]").equals([teamId, sessionId]).first();

  if (existing) {
    return {
      ...existing,
      assignments: normalizeBoardAssignments(existing.assignments),
    };
  }

  const created: Omit<BoardState, "id"> = {
    teamId,
    sessionId,
    assignments: createEmptyBoardAssignments(),
    updatedAt: new Date().toISOString(),
  };

  const id = await db.boardStates.add(created);
  return { id: assertNumericId(id, "board state"), ...created };
}

export async function upsertBoardState(input: {
  teamId: number;
  sessionId: number;
  assignments: Array<number | null>;
}): Promise<void> {
  const existing = await db.boardStates.where("[teamId+sessionId]").equals([input.teamId, input.sessionId]).first();
  const payload = {
    teamId: input.teamId,
    sessionId: input.sessionId,
    assignments: normalizeBoardAssignments(input.assignments),
    updatedAt: new Date().toISOString(),
  };

  if (!existing?.id) {
    await db.boardStates.add(payload);
    return;
  }

  await db.boardStates.update(existing.id, payload);
}

export async function resetBoardState(teamId: number, sessionId: number): Promise<void> {
  await upsertBoardState({
    teamId,
    sessionId,
    assignments: createEmptyBoardAssignments(),
  });
}
