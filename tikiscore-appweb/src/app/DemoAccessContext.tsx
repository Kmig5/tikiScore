import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Permission } from "../domain/types";
import { getActiveChampionshipId, setActiveChampionshipId, tikiScoreApi, type AuthenticatedUser } from "../services/api";
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
  "system:admin:manage": "system:admin:manage",
};

function prepareChampionshipContext(user: AuthenticatedUser | null, publicChampionships: { id: string }[]): void {
  const savedId = getActiveChampionshipId();
  const membershipIds = user?.championships.map((championship) => championship.id) ?? [];
  const requestedSlug = new URLSearchParams(window.location.search).get("championship");
  if (requestedSlug) {
    const requested = user?.championships.find((championship) => championship.slug === requestedSlug)
      ?? publicChampionships.find((championship) => "slug" in championship && championship.slug === requestedSlug);
    if (requested) {
      setActiveChampionshipId(requested.id);
      return;
    }
  }
  if (savedId && [...membershipIds, ...publicChampionships.map((championship) => championship.id)].includes(savedId)) return;
  setActiveChampionshipId(user?.championships[0]?.id ?? publicChampionships[0]?.id ?? null);
}

export function DemoAccessProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [publicChampionships, setPublicChampionships] = useState<Awaited<ReturnType<typeof tikiScoreApi.getPublicChampionships>>>([]);
  const [isSwitchingChampionship, setIsSwitchingChampionship] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const restored = await tikiScoreApi.restoreSession();
        const publicOptions = await tikiScoreApi.getPublicChampionships().catch(() => []);
        if (active) setPublicChampionships(publicOptions);
        prepareChampionshipContext(restored, publicOptions);
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
    publicChampionships,
    isSwitchingChampionship,
    permissions: (user?.championships.find((championship) => championship.id === getActiveChampionshipId())?.permissions ?? user?.permissions ?? [])
      .map((permission) => permissionNames[permission]).filter((permission): permission is Permission => Boolean(permission)),
    async signIn(username: string, password: string) {
      const signedInUser = await tikiScoreApi.signIn(username, password);
      prepareChampionshipContext(signedInUser, publicChampionships);
      setUser(signedInUser);
      await tikiScoreService.refresh();
    },
    async register(username: string, displayName: string, password: string) {
      const registeredUser = await tikiScoreApi.register(username, displayName, password);
      prepareChampionshipContext(registeredUser, publicChampionships);
      setUser(registeredUser);
      await tikiScoreService.refresh();
    },
    async refreshCurrentUser() {
      const currentUser = await tikiScoreApi.getCurrentUser();
      prepareChampionshipContext(currentUser, publicChampionships);
      setUser(currentUser);
    },
    async switchChampionship(championshipId: string) {
        if (!user?.championships.some((championship) => championship.id === championshipId)
          && !publicChampionships.some((championship) => championship.id === championshipId)) {
        throw new Error("Vous n’avez pas accès à ce championnat.");
      }
      setIsSwitchingChampionship(true);
      setActiveChampionshipId(championshipId);
      try {
        const currentUser = await tikiScoreApi.getCurrentUser();
        setUser(currentUser);
        await tikiScoreService.refresh();
      } finally {
        setIsSwitchingChampionship(false);
      }
    },
    async signOut() { await tikiScoreApi.signOut(); setUser(null); },
  }), [user, isSwitchingChampionship, publicChampionships]);

  return <DemoAccessContext.Provider value={value}>{children}</DemoAccessContext.Provider>;
}
