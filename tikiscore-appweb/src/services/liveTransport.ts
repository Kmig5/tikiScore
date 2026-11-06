import type { MatchEvent, MatchStatus } from "../domain/types";
import { Client, type StompSubscription } from "@stomp/stompjs";
import { getLiveWebSocketUrl, tikiScoreApi } from "./api";

export type LiveConnectionStatus = "connected" | "reconnecting" | "disconnected";

export interface LiveMatchSnapshot {
  type: "SCORE_SNAPSHOT";
  matchId: string;
  serverTime: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  minute: number;
  version: number;
}

export interface LiveTransport {
  connect(matchId: string, onStatus: (status: LiveConnectionStatus) => void, onSnapshot: (snapshot: LiveMatchSnapshot) => void): () => void;
  resync(matchId: string): Promise<MatchEvent[]>;
}

export const apiLiveTransport: LiveTransport = {
  connect(matchId, onStatus, onEvent) {
    let active = true;
    let subscription: StompSubscription | undefined;
    const client = new Client({
      brokerURL: getLiveWebSocketUrl(),
      reconnectDelay: 3_000,
      heartbeatIncoming: 30_000,
      heartbeatOutgoing: 30_000,
      onConnect: () => {
        if (!active) return;
        onStatus("connected");
        subscription = client.subscribe(`/topic/matches/${matchId}`, (message) => {
          try {
            const snapshot = JSON.parse(message.body) as LiveMatchSnapshot;
            if (snapshot.type === "SCORE_SNAPSHOT" && snapshot.matchId === matchId) onEvent(snapshot);
          } catch {
            onStatus("reconnecting");
          }
        });
      },
      onStompError: () => onStatus("reconnecting"),
      onWebSocketClose: () => {
        if (active) onStatus("reconnecting");
      },
      onWebSocketError: () => onStatus("reconnecting"),
    });
    onStatus("reconnecting");
    client.activate();
    return () => {
      active = false;
      subscription?.unsubscribe();
      void client.deactivate();
      onStatus("disconnected");
    };
  },
  async resync(matchId): Promise<MatchEvent[]> {
    return tikiScoreApi.getEvents(matchId);
  },
};
