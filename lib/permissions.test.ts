import { describe, expect, it, vi } from "vitest";

import { ROLE_STORAGE_KEY, confirmBoardReset, getStoredRole, hasPermission } from "@/lib/permissions";

describe("permissions policy", () => {
  it("reads a valid role from localStorage", () => {
    const role = getStoredRole({
      getItem: (key: string) => (key === ROLE_STORAGE_KEY ? "manager" : null),
    });

    expect(role).toBe("manager");
  });

  it("falls back to player for unknown localStorage values", () => {
    const role = getStoredRole({
      getItem: () => "coach",
    });

    expect(role).toBe("player");
  });

  it("allows only manager and captain to reset board", () => {
    expect(hasPermission("manager", "board.reset")).toBe(true);
    expect(hasPermission("captain", "board.reset")).toBe(true);
    expect(hasPermission("player", "board.reset")).toBe(false);
  });
});

describe("board reset confirmation", () => {
  it("does not show confirmation for unauthorized role", () => {
    const confirm = vi.fn(() => true);

    const approved = confirmBoardReset({
      role: "player",
      message: "reset?",
      confirm,
    });

    expect(approved).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("requires explicit confirmation for authorized role", () => {
    const confirm = vi.fn(() => false);

    const approved = confirmBoardReset({
      role: "manager",
      message: "reset?",
      confirm,
    });

    expect(approved).toBe(false);
    expect(confirm).toHaveBeenCalledWith("reset?");
  });
});
