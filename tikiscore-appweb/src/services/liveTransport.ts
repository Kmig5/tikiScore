import type { MatchEvent } from "../domain/types";
import { tikiScoreApi } from "./api";

export type LiveConnectionStatus = "connected" | "reconnecting" | "disconnected";

export interface LiveTransport {
  connect(matchId: string, onStatus: (status: LiveConnectionStatus) => void, onEvent: (event: MatchEvent) => void): () => void;
  resync(matchId: string): Promise<MatchEvent[]>;
}

export const apiLiveTransport: LiveTransport = {
  connect(matchId, onStatus, onEvent) {
    let active = true;
    let cursor = 0;
    const seen = new Set<string>();
    let timer = 0;

    async function poll() {
      if (!active) return;
      try {
        const events = await tikiScoreApi.getEvents(matchId, cursor);
        for (const event of events) {
          cursor = Math.max(cursor, event.sequence ?? cursor);
          if (!seen.has(event.id)) {
            seen.add(event.id);
            onEvent(event);
          }
        }
        onStatus("connected");
        timer = window.setTimeout(poll, 3_000);
      } catch {
        onStatus("reconnecting");
        timer = window.setTimeout(poll, 5_000);
      }
    }

    onStatus("reconnecting");
    void poll();
    return () => {
      active = false;
      window.clearTimeout(timer);
      onStatus("disconnected");
    };
  },
  async resync(matchId): Promise<MatchEvent[]> {
    return tikiScoreApi.getEvents(matchId);
  },
};
