import type { MatchEvent } from "../domain/types";
import { tikiScoreService } from "./tikiScoreService";

export type LiveConnectionStatus = "connected" | "reconnecting" | "disconnected";

export interface LiveTransport {
  connect(matchId: string, onStatus: (status: LiveConnectionStatus) => void, onEvent: (event: MatchEvent) => void): () => void;
  resync(matchId: string): Promise<MatchEvent[]>;
}

export const demoLiveTransport: LiveTransport = {
  connect(_matchId, onStatus, _onEvent) {
    void _onEvent;
    onStatus("disconnected");
    return () => undefined;
  },
  async resync(matchId) {
    return tikiScoreService.getMatch(matchId)?.events ?? [];
  },
};