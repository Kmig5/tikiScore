import { tikiScoreApi } from "./api";
import type { Announcement, MatchEventInput, Player, Team, TikiScoreData } from "../domain/types";
import type { LiveMatchSnapshot } from "./liveTransport";

export type DataStatus =
  | { state: "loading"; message: string }
  | { state: "ready"; message: "" }
  | { state: "error"; message: string };

export interface ServiceMode {
  kind: "api";
  persistent: true;
  liveConnected: true;
}

const mode: ServiceMode = { kind: "api", persistent: true, liveConnected: true };
let state: TikiScoreData = {
  championship: { id: "", name: "", edition: "", description: "", locality: "", startDate: "", endDate: "", publicUrl: "/", format: "" },
  groups: [], teams: [], players: [], matches: [], standings: [], leaderboard: [],
  statistics: { matchesPlayed: 0, goalsScored: 0, teamsCount: 0, playersCount: 0 },
  announcements: [], notifications: [], discussions: [], forumCategories: [], reports: [], demoPersonas: [], forumPublic: false,
};
let status: DataStatus = { state: "loading", message: "Connexion au serveur…" };
let refreshInFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const statusListeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function notifyStatus(): void {
  statusListeners.forEach((listener) => listener());
}

function setStatus(next: DataStatus): void {
  status = next;
  notifyStatus();
}

function updateMatch(matchId: string, update: (match: TikiScoreData["matches"][number]) => TikiScoreData["matches"][number]): void {
  state = { ...state, matches: state.matches.map((match) => match.id === matchId ? update(match) : match) };
  notify();
}

function applyMatchResponse(matchId: string, updatedMatch: TikiScoreData["matches"][number]): void {
  updateMatch(matchId, (current) => ({
    ...updatedMatch,
    assignedManagerIds: current.assignedManagerIds,
    events: current.events,
  }));
}

async function refresh(): Promise<void> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    setStatus({ state: "loading", message: "Chargement des données du championnat…" });
    try {
      const [publicData, privateData] = await Promise.all([tikiScoreApi.getPublicData(), tikiScoreApi.getPrivateData()]);
      const privateMatches = privateData.matches ?? [];
      const publicMatches = privateMatches.length
        ? publicData.matches.map((match) => {
          const assigned = privateMatches.find((candidate) => candidate.id === match.id);
          return assigned ? { ...match, assignedManagerIds: assigned.assignedManagerIds, events: assigned.events } : match;
        })
        : publicData.matches;
      state = { ...publicData, ...privateData, matches: publicMatches };
      setStatus({ state: "ready", message: "" });
      notify();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de charger les données du serveur.";
      setStatus({ state: "error", message });
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function mutate(operation: () => Promise<unknown>): Promise<void> {
  await operation();
  await refresh();
}

export const tikiScoreService = {
  mode,
  initialize: refresh,
  refresh,
  getStatus: () => status,
  subscribeStatus(listener: () => void): () => void {
    statusListeners.add(listener);
    return () => statusListeners.delete(listener);
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): TikiScoreData { return state; },
  getChampionship: () => state.championship,
  getGroups: () => state.groups,
  getTeams: () => state.teams,
  getPlayers: () => state.players,
  getMatches: () => state.matches,
  getMatch: (matchId: string) => state.matches.find((match) => match.id === matchId),
  getStandings: () => state.standings,
  getLeaderboard: () => state.leaderboard,
  getStatistics: () => state.statistics,
  getAnnouncements: () => state.announcements,
  getNotifications: () => state.notifications,
  getDiscussions: () => state.discussions,

  applyLiveSnapshot(snapshot: LiveMatchSnapshot): void {
    updateMatch(snapshot.matchId, (match) => {
      if ((match.version ?? -1) > snapshot.version) return match;
      return {
        ...match,
        status: snapshot.status as typeof match.status,
        homeScore: snapshot.homeScore,
        awayScore: snapshot.awayScore,
        minute: snapshot.minute,
        version: snapshot.version,
      };
    });
  },
  async appendMatchEvent(matchId: string, input: MatchEventInput): Promise<void> {
    const event = await tikiScoreApi.recordEvent(matchId, input);
    updateMatch(matchId, (match) => ({
      ...match,
      homeScore: event.homeScoreAfter,
      awayScore: event.awayScoreAfter,
      events: [...match.events.filter((candidate) => candidate.id !== event.id), event]
        .sort((left, right) => (left.sequence ?? 0) - (right.sequence ?? 0)),
    }));
  },
  async refreshMatch(matchId: string): Promise<void> {
    const updatedMatch = await tikiScoreApi.getMatch(matchId);
    state = { ...state, matches: state.matches.map((match) => match.id === matchId
      ? { ...updatedMatch, assignedManagerIds: match.assignedManagerIds }
      : match) };
    notify();
  },
  async removeMatchEvent(matchId: string, eventId: string): Promise<void> {
    await tikiScoreApi.cancelEvent(matchId, eventId);
    await this.refreshMatch(matchId);
  },
  async setDiscussionState(discussionId: string, update: { pinned?: boolean; closed?: boolean; hidden?: boolean }): Promise<void> {
    await mutate(() => tikiScoreApi.updateForumState(discussionId, update));
  },
  async addReply(discussionId: string, body: string): Promise<void> {
    await mutate(() => tikiScoreApi.reply(discussionId, body));
  },
  async createDiscussion(body: string): Promise<void> {
    const category = state.forumCategories[0];
    if (!category) throw new Error("Aucune catégorie du forum n’est configurée.");
    const title = body.trim().slice(0, 80);
    await mutate(() => tikiScoreApi.createDiscussion(category.id, title, body));
  },
  async addForumReport(postId: string, reason: string): Promise<void> {
    await mutate(() => tikiScoreApi.report(postId, reason));
  },
  async resolveForumReport(reportId: string): Promise<void> {
    await mutate(() => tikiScoreApi.resolveReport(reportId));
  },
  async addTeam(input: Omit<Team, "id">): Promise<void> {
    await mutate(() => tikiScoreApi.createTeam(input));
  },
  async addPlayer(input: Omit<Player, "id">): Promise<void> {
    await mutate(() => tikiScoreApi.createPlayer(input));
  },
  async addMatch(input: { groupId: string; homeTeamId: string; awayTeamId: string; startsAt: string; venue: string }): Promise<void> {
    await mutate(() => tikiScoreApi.createMatch(input));
  },
  async addAnnouncement(input: Pick<Announcement, "title" | "excerpt" | "body" | "priority">): Promise<void> {
    await mutate(() => tikiScoreApi.createAnnouncement(input));
  },
  async markNotificationRead(id: string): Promise<void> {
    await mutate(() => tikiScoreApi.markNotificationRead(id));
  },
  async markAllNotificationsRead(): Promise<void> {
    await mutate(() => tikiScoreApi.markAllNotificationsRead());
  },
  async setForumPublic(enabled: boolean): Promise<void> {
    await mutate(() => tikiScoreApi.updateChampionship({ forumPublic: enabled }));
  },
  async updateManagerAssignment(matchId: string, managerIds: string[]): Promise<void> {
    await mutate(() => tikiScoreApi.assignManagers(matchId, managerIds));
  },
  async startMatch(matchId: string): Promise<void> { applyMatchResponse(matchId, await tikiScoreApi.startMatch(matchId)); },
  async halfTime(matchId: string): Promise<void> { applyMatchResponse(matchId, await tikiScoreApi.halfTime(matchId)); },
  async resumeMatch(matchId: string): Promise<void> { applyMatchResponse(matchId, await tikiScoreApi.resumeMatch(matchId)); },
  async finishMatch(matchId: string): Promise<void> { applyMatchResponse(matchId, await tikiScoreApi.finishMatch(matchId)); },
};
