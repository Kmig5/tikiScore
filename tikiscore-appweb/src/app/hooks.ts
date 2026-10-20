import { useSyncExternalStore } from "react";
import { tikiScoreService } from "../services/tikiScoreService";

export function useTikiScoreData() {
  return useSyncExternalStore(tikiScoreService.subscribe, tikiScoreService.getSnapshot, tikiScoreService.getSnapshot);
}