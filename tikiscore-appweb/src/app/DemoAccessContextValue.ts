import { createContext } from "react";
import type { DemoPersonaId, Permission } from "../domain/types";

export interface DemoAccessValue {
  personaId: DemoPersonaId;
  permissions: Permission[];
  setPersonaId: (personaId: DemoPersonaId) => void;
}

export const DemoAccessContext = createContext<DemoAccessValue | null>(null);