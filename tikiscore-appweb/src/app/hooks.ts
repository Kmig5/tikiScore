import { useEffect, useState, useSyncExternalStore } from "react";
import { tikiScoreService } from "../services/tikiScoreService";
import type { Match } from "../domain/types";

export function useTikiScoreData() {
  return useSyncExternalStore(tikiScoreService.subscribe, tikiScoreService.getSnapshot, tikiScoreService.getSnapshot);
}

export function useTikiScoreStatus() {
  return useSyncExternalStore(tikiScoreService.subscribeStatus, tikiScoreService.getStatus, tikiScoreService.getStatus);
}

export function useLiveMatchMinute(match?: Match): number {
  const isLive = match?.status === "live";
  const events = match?.events ?? [];
  const latestStart = [...events].reverse().find((event) => event.type === "periodStart" || event.type === "periodResume");
  const startedAt = latestStart?.occurredAt ?? (isLive ? match?.startsAt : undefined);
  const baseMinute = latestStart?.minute ?? match?.minute ?? 0;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isLive || !startedAt) return;
    const intervalId = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(intervalId);
  }, [isLive, startedAt]);

  const elapsedMinutes = startedAt ? Math.floor((now - new Date(startedAt).getTime()) / 60_000) : 0;
  return baseMinute + Math.max(0, isLive ? elapsedMinutes : 0);
}