import { describe, expect, it } from "vitest";

import {
  assignPlayerToSlot,
  BOARD_SLOT_COUNT,
  createEmptyBoardAssignments,
  normalizeBoardAssignments,
  removePlayerFromSlot,
} from "@/lib/board";

describe("board helpers", () => {
  it("creates empty six-slot board", () => {
    const assignments = createEmptyBoardAssignments();
    expect(assignments).toHaveLength(BOARD_SLOT_COUNT);
    expect(assignments.every((slot) => slot === null)).toBe(true);
  });

  it("normalizes arrays to six slots", () => {
    expect(normalizeBoardAssignments([10, null])).toEqual([10, null, null, null, null, null]);
    expect(normalizeBoardAssignments([1, 2, 3, 4, 5, 6, 7])).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("assigns a player and keeps one slot per player", () => {
    const first = assignPlayerToSlot(createEmptyBoardAssignments(), 0, 12);
    expect(first[0]).toBe(12);

    const moved = assignPlayerToSlot(first, 4, 12);
    expect(moved[0]).toBeNull();
    expect(moved[4]).toBe(12);
  });

  it("removes player from slot", () => {
    const base = assignPlayerToSlot(createEmptyBoardAssignments(), 2, 8);
    const next = removePlayerFromSlot(base, 2);
    expect(next[2]).toBeNull();
  });
});
