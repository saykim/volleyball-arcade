import { describe, expect, it, vi } from "vitest";

import {
  DENY_MESSAGE_KO,
  ROLE_STORAGE_KEY,
  canAccessRoute,
  confirmBoardReset,
  getStoredRole,
  hasPermission,
} from "@/lib/permissions";

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

  it("allows only captain to reset board", () => {
    expect(hasPermission("manager", "board.reset")).toBe(false);
    expect(hasPermission("captain", "board.reset")).toBe(true);
    expect(hasPermission("player", "board.reset")).toBe(false);
  });

  it("keeps player strictly read-only", () => {
    expect(hasPermission("player", "team.create")).toBe(false);
    expect(hasPermission("player", "player.create")).toBe(false);
    expect(hasPermission("player", "session.create")).toBe(false);
    expect(hasPermission("player", "session.edit")).toBe(false);
    expect(hasPermission("player", "event.create")).toBe(false);
    expect(hasPermission("player", "event.edit")).toBe(false);
    expect(hasPermission("player", "board.assign")).toBe(false);
  });

  it("allows manager add and edit but denies destructive session reset/delete", () => {
    expect(hasPermission("manager", "team.create")).toBe(true);
    expect(hasPermission("manager", "player.create")).toBe(true);
    expect(hasPermission("manager", "session.create")).toBe(true);
    expect(hasPermission("manager", "session.edit")).toBe(true);
    expect(hasPermission("manager", "event.create")).toBe(true);
    expect(hasPermission("manager", "event.edit")).toBe(true);
    expect(hasPermission("manager", "session.delete")).toBe(false);
    expect(hasPermission("manager", "board.reset")).toBe(false);
  });

  it("allows captain full permissions", () => {
    expect(hasPermission("captain", "team.create")).toBe(true);
    expect(hasPermission("captain", "player.create")).toBe(true);
    expect(hasPermission("captain", "session.create")).toBe(true);
    expect(hasPermission("captain", "session.edit")).toBe(true);
    expect(hasPermission("captain", "session.delete")).toBe(true);
    expect(hasPermission("captain", "event.create")).toBe(true);
    expect(hasPermission("captain", "event.edit")).toBe(true);
    expect(hasPermission("captain", "event.delete")).toBe(true);
    expect(hasPermission("captain", "board.assign")).toBe(true);
    expect(hasPermission("captain", "board.reset")).toBe(true);
  });
});

describe("route guard policy", () => {
  it("blocks player deep links to management routes", () => {
    expect(canAccessRoute("player", "/team")).toEqual({ allowed: false, message: DENY_MESSAGE_KO });
    expect(canAccessRoute("player", "/sessions")).toEqual({ allowed: false, message: DENY_MESSAGE_KO });
    expect(canAccessRoute("player", "/board")).toEqual({ allowed: false, message: DENY_MESSAGE_KO });
  });

  it("allows manager and captain into management routes", () => {
    expect(canAccessRoute("manager", "/team")).toEqual({ allowed: true });
    expect(canAccessRoute("manager", "/sessions")).toEqual({ allowed: true });
    expect(canAccessRoute("manager", "/board")).toEqual({ allowed: true });
    expect(canAccessRoute("captain", "/team")).toEqual({ allowed: true });
    expect(canAccessRoute("captain", "/sessions")).toEqual({ allowed: true });
    expect(canAccessRoute("captain", "/board")).toEqual({ allowed: true });
  });

  it("allows all roles on non-management routes", () => {
    expect(canAccessRoute("player", "/")).toEqual({ allowed: true });
    expect(canAccessRoute("player", "/insights")).toEqual({ allowed: true });
    expect(canAccessRoute("player", "/player-mode")).toEqual({ allowed: true });
    expect(canAccessRoute("player", "/help")).toEqual({ allowed: true });
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
      role: "captain",
      message: "reset?",
      confirm,
    });

    expect(approved).toBe(false);
    expect(confirm).toHaveBeenCalledWith("reset?");
  });
});
