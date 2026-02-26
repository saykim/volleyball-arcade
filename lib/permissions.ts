export type UserRole = "manager" | "captain" | "player";

export type Permission =
  | "team.create"
  | "player.create"
  | "session.create"
  | "session.edit"
  | "session.delete"
  | "event.create"
  | "event.edit"
  | "event.delete"
  | "board.assign"
  | "board.reset";

export const ROLE_STORAGE_KEY = "volleyArcade.role";
export const DENY_MESSAGE_KO = "권한이 없습니다. 이 기능은 캡틴 또는 매니저 권한이 필요합니다.";

type ManagedRoute = "/team" | "/sessions" | "/board";

const PERMISSIONS: Record<Permission, ReadonlyArray<UserRole>> = {
  "team.create": ["captain", "manager"],
  "player.create": ["captain", "manager"],
  "session.create": ["captain", "manager"],
  "session.edit": ["captain", "manager"],
  "session.delete": ["captain"],
  "event.create": ["captain", "manager"],
  "event.edit": ["captain", "manager"],
  "event.delete": ["captain"],
  "board.assign": ["captain", "manager"],
  "board.reset": ["captain"],
};

const MANAGED_ROUTES: ReadonlyArray<ManagedRoute> = ["/team", "/sessions", "/board"];

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

export function setStoredRole(role: UserRole, storage?: Pick<Storage, "setItem">): void {
  if (storage) {
    storage.setItem(ROLE_STORAGE_KEY, role);
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ROLE_STORAGE_KEY, role);
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return Array.isArray(allowedRoles) && allowedRoles.includes(role);
}

function normalizePathname(pathname: string): string {
  if (!pathname) {
    return "/";
  }
  return pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
}

export function isManagedRoute(pathname: string): boolean {
  return MANAGED_ROUTES.includes(normalizePathname(pathname) as ManagedRoute);
}

export function canAccessRoute(role: UserRole, pathname: string): { allowed: true } | { allowed: false; message: string } {
  if (isManagedRoute(pathname) && role === "player") {
    return { allowed: false, message: DENY_MESSAGE_KO };
  }

  return { allowed: true };
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
