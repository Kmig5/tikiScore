import { tikiScoreApi } from "./api";
import type { Announcement, MatchEventInput, Player, Team, TikiScoreData } from "../domain/types";

export type DataStatus =
  | { state: "loading"; message: string }
  | { state: "ready"; message: "" }
  | { state: "error"; message: string };

export interface ServiceMode {
  kind: "api";
  persistent: true;
  liveConnected: false;
}

const mode: ServiceMode = { kind: "api", persistent: true, liveConnected: false };
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

  async appendMatchEvent(matchId: string, input: MatchEventInput): Promise<void> {
    await mutate(() => tikiScoreApi.recordEvent(matchId, input));
  },
  async refreshMatch(matchId: string): Promise<void> {
    const updatedMatch = await tikiScoreApi.getMatch(matchId);
    state = { ...state, matches: state.matches.map((match) => match.id === matchId ? updatedMatch : match) };
    notify();
  },
  async removeMatchEvent(matchId: string, eventId: string): Promise<void> {
    await mutate(() => tikiScoreApi.cancelEvent(matchId, eventId));
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
  async startMatch(matchId: string): Promise<void> { await mutate(() => tikiScoreApi.startMatch(matchId)); },
  async halfTime(matchId: string): Promise<void> { await mutate(() => tikiScoreApi.halfTime(matchId)); },
  async resumeMatch(matchId: string): Promise<void> { await mutate(() => tikiScoreApi.resumeMatch(matchId)); },
  async finishMatch(matchId: string): Promise<void> { await mutate(() => tikiScoreApi.finishMatch(matchId)); },
};
