export const BOARD_SLOT_COUNT = 6;

export function createEmptyBoardAssignments(): Array<number | null> {
  return Array.from({ length: BOARD_SLOT_COUNT }, () => null);
}

export function normalizeBoardAssignments(assignments: Array<number | null>): Array<number | null> {
  const next = assignments.slice(0, BOARD_SLOT_COUNT).map((value) => (typeof value === "number" ? value : null));
  while (next.length < BOARD_SLOT_COUNT) {
    next.push(null);
  }
  return next;
}

export function assignPlayerToSlot(assignments: Array<number | null>, slotIndex: number, playerId: number): Array<number | null> {
  const next = normalizeBoardAssignments(assignments);

  for (let index = 0; index < next.length; index += 1) {
    if (next[index] === playerId) {
      next[index] = null;
    }
  }

  next[slotIndex] = playerId;
  return next;
}

export function removePlayerFromSlot(assignments: Array<number | null>, slotIndex: number): Array<number | null> {
  const next = normalizeBoardAssignments(assignments);
  next[slotIndex] = null;
  return next;
}
