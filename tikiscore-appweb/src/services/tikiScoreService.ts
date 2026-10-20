import { demoData } from "./demo/demoData";
import type { Announcement, ChampionshipStatistics, Match, MatchEvent, MatchEventInput, MatchStatus, Player, Team, TikiScoreData } from "../domain/types";

export interface ServiceMode {
  kind: "demo";
  persistent: false;
  liveConnected: false;
}

const mode: ServiceMode = { kind: "demo", persistent: false, liveConnected: false };
let state: TikiScoreData = structuredClone(demoData);
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function read<T>(selector: (data: TikiScoreData) => T): T {
  return selector(state);
}

function calculateStatistics(data: TikiScoreData): ChampionshipStatistics {
  const finishedMatches = data.matches.filter((match) => match.status === "finished");
  return {
    matchesPlayed: finishedMatches.length,
    goalsScored: finishedMatches.reduce((total, match) => total + (match.homeScore ?? 0) + (match.awayScore ?? 0), 0),
    teamsCount: data.teams.length,
    playersCount: data.players.length,
  };
}

export const tikiScoreService = {
  mode,

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot(): TikiScoreData {
    return state;
  },

  getChampionship: () => read((data) => data.championship),
  getGroups: () => read((data) => data.groups),
  getTeams: () => read((data) => data.teams),
  getPlayers: () => read((data) => data.players),
  getMatches: () => read((data) => data.matches),
  getMatch: (matchId: string) => read((data) => data.matches.find((match) => match.id === matchId)),
  getStandings: () => read((data) => data.standings),
  getLeaderboard: () => read((data) => data.leaderboard),
  getStatistics: () => read(calculateStatistics),
  getAnnouncements: () => read((data) => data.announcements),
  getNotifications: () => read((data) => data.notifications),
  getDiscussions: () => read((data) => data.discussions),

  appendMatchEvent(matchId: string, input: MatchEventInput): MatchEvent | undefined {
    const matchIndex = state.matches.findIndex((match) => match.id === matchId);
    if (matchIndex < 0) return undefined;
    const match = state.matches[matchIndex];
    const event: MatchEvent = {
      ...input,
      id: `demo-event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      matchId,
      occurredAt: new Date().toISOString(),
    };
    const events = [...match.events, event].sort((first, second) => first.minute - second.minute || first.occurredAt.localeCompare(second.occurredAt));
    let homeScore = match.homeScore ?? 0;
    let awayScore = match.awayScore ?? 0;
    if (input.type === "goal" && input.teamId === match.homeTeamId) homeScore += 1;
    if (input.type === "goal" && input.teamId === match.awayTeamId) awayScore += 1;

    const nextStatus: MatchStatus = input.type === "halftime" ? "halftime" : input.type === "periodResume" ? "live" : input.type === "fullTime" ? "finished" : match.status === "scheduled" ? "live" : match.status;
    const matches = state.matches.map((current, index) => index === matchIndex
      ? { ...current, events, status: nextStatus, homeScore, awayScore, minute: Math.max(current.minute ?? 0, input.minute) }
      : current);
    state = {
      ...state,
      matches,
      statistics: calculateStatistics({ ...state, matches }),
    };
    notify();
    return event;
  },

  removeMatchEvent(matchId: string, eventId: string): boolean {
    const match = state.matches.find((entry) => entry.id === matchId);
    const event = match?.events.find((entry) => entry.id === eventId);
    if (!match || !event) return false;
    const homeScore = event.type === "goal" && event.teamId === match.homeTeamId ? Math.max(0, (match.homeScore ?? 0) - 1) : match.homeScore;
    const awayScore = event.type === "goal" && event.teamId === match.awayTeamId ? Math.max(0, (match.awayScore ?? 0) - 1) : match.awayScore;
    const matches = state.matches.map((entry) => entry.id === matchId
      ? { ...entry, events: entry.events.filter((candidate) => candidate.id !== eventId), homeScore, awayScore, status: event.type === "fullTime" ? "live" : entry.status }
      : entry);
    state = {
      ...state,
      matches,
      statistics: calculateStatistics({ ...state, matches }),
    };
    notify();
    return true;
  },

  setDiscussionState(discussionId: string, update: { pinned?: boolean; closed?: boolean; hidden?: boolean }): void {
    state = {
      ...state,
      discussions: state.discussions.map((discussion) => discussion.id === discussionId ? { ...discussion, ...update } : discussion),
    };
    notify();
  },

  addDiscussion(title: string, body: string, authorName: string): void {
    const discussion = {
      id: `demo-discussion-${Date.now()}`,
      category: "Vie du tournoi",
      title,
      body,
      authorName,
      createdAt: new Date().toISOString(),
      replies: [],
      pinned: false,
      closed: false,
      hidden: false,
    };
    state = { ...state, discussions: [discussion, ...state.discussions] };
    notify();
  },

  addReply(discussionId: string, body: string, authorName: string): void {
    state = {
      ...state,
      discussions: state.discussions.map((discussion) => discussion.id === discussionId
        ? { ...discussion, replies: [...discussion.replies, { id: `demo-reply-${Date.now()}`, authorName, body, createdAt: new Date().toISOString(), hidden: false }] }
        : discussion),
    };
    notify();
  },

  addForumReport(discussionId: string, reason: string): void {
    state = {
      ...state,
      reports: [...state.reports, { id: `demo-report-${Date.now()}`, discussionId, reason, createdAt: new Date().toISOString(), resolved: false }],
    };
    notify();
  },

  resolveForumReport(reportId: string): void {
    state = { ...state, reports: state.reports.map((report) => report.id === reportId ? { ...report, resolved: true } : report) };
    notify();
  },

  addTeam(input: Omit<Team, "id">): Team {
    const team: Team = { ...input, id: `demo-team-${Date.now()}` };
    state = {
      ...state,
      teams: [...state.teams, team],
      statistics: calculateStatistics({ ...state, teams: [...state.teams, team] }),
    };
    notify();
    return team;
  },

  addPlayer(input: Omit<Player, "id">): Player {
    const player: Player = { ...input, id: `demo-player-${Date.now()}` };
    state = {
      ...state,
      players: [...state.players, player],
      statistics: calculateStatistics({ ...state, players: [...state.players, player] }),
    };
    notify();
    return player;
  },

  addMatch(input: Omit<Match, "id" | "events" | "status" | "assignedManagerIds">): Match {
    const match: Match = { ...input, id: `demo-match-${Date.now()}`, status: "scheduled", assignedManagerIds: [], events: [] };
    state = { ...state, matches: [...state.matches, match] };
    notify();
    return match;
  },

  setMatchManager(matchId: string, managerIds: string[]): void {
    state = { ...state, matches: state.matches.map((match) => match.id === matchId ? { ...match, assignedManagerIds: managerIds } : match) };
    notify();
  },

  addAnnouncement(input: Omit<Announcement, "id" | "publishedAt" | "official">): Announcement {
    const announcement: Announcement = { ...input, id: `demo-announcement-${Date.now()}`, publishedAt: new Date().toISOString(), official: true };
    state = { ...state, announcements: [announcement, ...state.announcements] };
    notify();
    return announcement;
  },

  markNotificationRead(notificationId: string): void {
    state = { ...state, notifications: state.notifications.map((notification) => notification.id === notificationId ? { ...notification, read: true } : notification) };
    notify();
  },

  markAllNotificationsRead(): void {
    state = { ...state, notifications: state.notifications.map((notification) => ({ ...notification, read: true })) };
    notify();
  },

  setForumPublic(forumPublic: boolean): void {
    state = { ...state, forumPublic };
    notify();
  },

  resetDemo(): void {
    state = structuredClone(demoData);
    notify();
  },
};