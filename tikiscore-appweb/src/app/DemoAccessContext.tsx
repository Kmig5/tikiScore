import { useMemo, useState, type ReactNode } from "react";
import { getDemoPermissions } from "../domain/permissions";
import { DemoAccessContext } from "./DemoAccessContextValue";
import type { DemoPersonaId } from "../domain/types";

export function DemoAccessProvider({ children }: { children: ReactNode }) {
  const [personaId, setPersonaId] = useState<DemoPersonaId>("visitor");
  const value = useMemo(() => ({ personaId, permissions: getDemoPermissions(personaId), setPersonaId }), [personaId]);

  return <DemoAccessContext.Provider value={value}>{children}</DemoAccessContext.Provider>;
}