export type SessionKind = "match" | "practice";

export type EventType = "serve" | "receive" | "spike" | "block" | "error";

export type EventOutcome = "success" | "error";

export type PlayerPosition = "setter" | "outside" | "middle" | "opposite" | "libero";

export interface Team {
  id?: number;
  name: string;
  createdAt: string;
}

export interface Player {
  id?: number;
  teamId: number;
  displayName: string;
  jerseyNumber: number;
  position: PlayerPosition;
  createdAt: string;
}

export interface Session {
  id?: number;
  teamId: number;
  kind: SessionKind;
  date: string;
  opponent?: string;
  /** Final score (optional). Example: 25 */
  scoreUs?: number;
  /** Final score (optional). Example: 18 */
  scoreThem?: number;
  /** Optional set-by-set string. Example: "25-18, 23-25, 15-13" */
  setScores?: string;
  notes?: string;
  createdAt: string;
}

export interface StatEvent {
  id?: number;
  teamId: number;
  sessionId: number;
  playerId: number;
  type: EventType;
  outcome: EventOutcome;
  note?: string;
  createdAt: string;
}

export interface PlayerStats {
  serveSuccess: number;
  receiveSuccess: number;
  spikeSuccess: number;
  blockSuccess: number;
  errors: number;
  totalEvents: number;
}

export interface PlayerInsight {
  strengths: string[];
  weaknesses: string[];
  tip: string;
  missions: string[];
}

export type CourtSlot = 1 | 2 | 3 | 4 | 5 | 6;

export interface BoardState {
  id?: number;
  teamId: number;
  sessionId: number;
  assignments: Array<number | null>;
  updatedAt: string;
}
