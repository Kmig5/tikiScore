import { useContext } from "react";
import { DemoAccessContext } from "./DemoAccessContextValue";

export function useDemoAccess() {
  const value = useContext(DemoAccessContext);
  if (!value) throw new Error("useDemoAccess doit être utilisé dans DemoAccessProvider.");
  return value;
}