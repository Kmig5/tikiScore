export type Permission =
  | "championship:read"
  | "profile:read"
  | "profile:update"
  | "notifications:manage"
  | "forum:participate"
  | "forum:report"
  | "forum:moderate"
  | "match:manage:assigned"
  | "competition:manage"
  | "competition:share";

export type DemoPersonaId = "visitor" | "member" | "matchManager" | "administrator" | "moderator";
export type MatchStatus = "scheduled" | "live" | "halftime" | "finished" | "postponed" | "cancelled";
export type MatchEventType = "goal" | "yellowCard" | "redCard" | "substitution" | "periodStart" | "halftime" | "periodResume" | "fullTime";

export interface Championship {
  id: string;
  name: string;
  edition: string;
  description: string;
  locality: string;
  startDate: string;
  endDate: string;
  publicUrl: string;
  format: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  locality: string;
  primaryColor: string;
  secondaryColor: string;
  groupId: string;
}

export interface Player {
  id: string;
  displayName: string;
  jerseyNumber: number | null;
  teamId: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface ForumCategory {
  id: string;
  name: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  type: MatchEventType;
  minute: number;
  occurredAt: string;
  sequence?: number;
  teamId?: string;
  playerId?: string;
  relatedPlayerId?: string;
  note?: string;
}

export interface Match {
  id: string;
  groupId: string;
  homeTeamId: string;
  awayTeamId: string;
  startsAt: string;
  venue: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
  assignedManagerIds: string[];
  events: MatchEvent[];
}

export interface Standing {
  teamId: string;
  groupId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface LeaderboardEntry {
  playerId: string;
  teamId: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export interface ChampionshipStatistics {
  matchesPlayed: number;
  goalsScored: number;
  teamsCount: number;
  playersCount: number;
}

export interface Announcement {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  publishedAt: string;
  priority: "normal" | "important";
  official: true;
}

export interface ChampionshipNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  category: "match" | "schedule" | "announcement" | "discussion";
  read: boolean;
}

export interface DiscussionReply {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  hidden: boolean;
}

export interface Discussion {
  id: string;
  category: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  replies: DiscussionReply[];
  pinned: boolean;
  closed: boolean;
  hidden: boolean;
}

export interface ForumReport {
  id: string;
  discussionId: string;
  reason: string;
  createdAt: string;
  resolved: boolean;
}

export interface DemoPersona {
  id: DemoPersonaId;
  label: string;
}

export interface TikiScoreData {
  championship: Championship;
  groups: Group[];
  teams: Team[];
  players: Player[];
  matches: Match[];
  standings: Standing[];
  leaderboard: LeaderboardEntry[];
  statistics: ChampionshipStatistics;
  announcements: Announcement[];
  notifications: ChampionshipNotification[];
  discussions: Discussion[];
  forumCategories: ForumCategory[];
  reports: ForumReport[];
  demoPersonas: DemoPersona[];
  forumPublic: boolean;
}

export interface MatchEventInput {
  type: MatchEventType;
  minute: number;
  teamId?: string;
  playerId?: string;
  relatedPlayerId?: string;
}