import { createContext } from "react";
import type { Permission } from "../domain/types";
import type { AuthenticatedUser } from "../services/api";

export interface DemoAccessValue {
  user: AuthenticatedUser | null;
  permissions: Permission[];
  signIn: (username: string, password: string) => Promise<void>;
  register: (username: string, displayName: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const DemoAccessContext = createContext<DemoAccessValue | null>(null);
