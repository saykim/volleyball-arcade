"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { ROLE_STORAGE_KEY, getStoredRole, setStoredRole, type UserRole } from "@/lib/permissions";

interface RoleValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => getStoredRole());

  useEffect(() => {
    function syncFromStorage(event: StorageEvent): void {
      if (event.key !== null && event.key !== ROLE_STORAGE_KEY) {
        return;
      }
      setRoleState(getStoredRole());
    }

    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  const value = useMemo<RoleValue>(
    () => ({
      role,
      setRole: (nextRole) => {
        setStoredRole(nextRole);
        setRoleState(nextRole);
      },
    }),
    [role],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleValue {
  const value = useContext(RoleContext);
  if (!value) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return value;
}
