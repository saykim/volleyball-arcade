import type { EventOutcome, EventType, PlayerPosition, SessionKind } from "@/lib/domain";

export const SESSION_KINDS: SessionKind[] = ["match", "practice"];
export const PLAYER_POSITIONS: PlayerPosition[] = [
  "setter",
  "outside",
  "middle",
  "opposite",
  "libero",
];
export const EVENT_TYPES: EventType[] = ["serve", "receive", "spike", "block", "error"];
export const EVENT_OUTCOMES: EventOutcome[] = ["success", "error"];
