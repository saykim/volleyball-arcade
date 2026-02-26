export type UserRole = "manager" | "captain" | "player";

export type Permission = "board.reset";

export const ROLE_STORAGE_KEY = "volleyArcade.role";

const PERMISSIONS: Record<Permission, ReadonlyArray<UserRole>> = {
  "board.reset": ["manager", "captain"],
};

export function isUserRole(value: string | null): value is UserRole {
  return value === "manager" || value === "captain" || value === "player";
}

export function getStoredRole(storage?: Pick<Storage, "getItem">): UserRole {
  if (storage) {
    const stored = storage.getItem(ROLE_STORAGE_KEY);
    return isUserRole(stored) ? stored : "player";
  }

  if (typeof window === "undefined") {
    return "player";
  }

  const stored = window.localStorage.getItem(ROLE_STORAGE_KEY);
  return isUserRole(stored) ? stored : "player";
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[permission].includes(role);
}

export function confirmBoardReset(input: {
  role: UserRole;
  message: string;
  confirm: (message: string) => boolean;
}): boolean {
  if (!hasPermission(input.role, "board.reset")) {
    return false;
  }

  return input.confirm(input.message);
}
