import { createContext } from "react";
import type { Permission } from "../domain/types";
import type { AuthenticatedUser, PublicChampionshipOption } from "../services/api";

export interface DemoAccessValue {
  user: AuthenticatedUser | null;
  permissions: Permission[];
  publicChampionships: PublicChampionshipOption[];
  isSwitchingChampionship: boolean;
  switchChampionship: (championshipId: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  register: (username: string, displayName: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

export const DemoAccessContext = createContext<DemoAccessValue | null>(null);
