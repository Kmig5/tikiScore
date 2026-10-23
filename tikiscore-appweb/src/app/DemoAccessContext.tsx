import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Permission } from "../domain/types";
import { tikiScoreApi, type AuthenticatedUser } from "../services/api";
import { tikiScoreService } from "../services/tikiScoreService";
import { DemoAccessContext } from "./DemoAccessContextValue";

const permissionNames: Record<string, Permission> = {
  "championship:read": "championship:read",
  "profile:read": "profile:read",
  "profile:update": "profile:update",
  "notifications:manage": "notifications:manage",
  "forum:participate": "forum:participate",
  "forum:report": "forum:report",
  "forum:moderate": "forum:moderate",
  "match:manage:assigned": "match:manage:assigned",
  "competition:manage": "competition:manage",
  "competition:share": "competition:share",
};

export function DemoAccessProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const restored = await tikiScoreApi.restoreSession();
        if (active) setUser(restored);
      } catch (error) {
        console.error("Impossible de restaurer la session.", error);
      }
      if (active) await tikiScoreService.refresh();
    })();
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    permissions: user?.permissions.map((permission) => permissionNames[permission]).filter((permission): permission is Permission => Boolean(permission)) ?? [],
    async signIn(username: string, password: string) {
      setUser(await tikiScoreApi.signIn(username, password));
      await tikiScoreService.refresh();
    },
    async register(username: string, displayName: string, password: string) {
      setUser(await tikiScoreApi.register(username, displayName, password));
      await tikiScoreService.refresh();
    },
    async signOut() { await tikiScoreApi.signOut(); setUser(null); },
  }), [user]);

  return <DemoAccessContext.Provider value={value}>{children}</DemoAccessContext.Provider>;
}
