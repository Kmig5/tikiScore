import type { Announcement, Championship, ChampionshipNotification, ChampionshipStatistics, Discussion, DiscussionReply, ForumReport, Group, LeaderboardEntry, Match, MatchEvent, MatchEventInput, MatchStatus, Player, Standing, Team, TikiScoreData } from "../domain/types";

const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
let accessToken: string | null = null;
let csrfToken: string | null = null;
let csrfHeader = "X-XSRF-TOKEN";
let authenticatedUser: AuthenticatedUser | null = null;

export interface AuthenticatedUser {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

interface TokenResponse {
  accessToken: string;
  tokenType: string;
  user: AuthenticatedUser;
}
interface ApiErrorBody { message?: string; detail?: string; }
interface CompetitionDto extends Championship { status: string; forumPublic: boolean; }
interface TeamDto extends Team {}
interface PlayerDto { id: string; displayName: string; jerseyNumber: number | null; teamId: string; position?: string; }
interface MatchDto {
  id: string; groupId: string | null; homeTeamId: string; awayTeamId: string; startsAt: string; venue: string;
  status: MatchStatus; homeScore: number; awayScore: number; minute: number; version: number;
}
interface EventDto extends MatchEvent {
  clientEventId: string; addedTime: number; sequence: number; state: string;
  homeScoreAfter: number; awayScoreAfter: number;
}
interface GroupDto extends Group {}
interface StandingDto extends Standing { position: number; teamName: string; goalDifference: number; }
interface PlayerStatisticDto { playerId: string; playerName: string; teamId: string; teamName: string; goals: number; assists: number; yellowCards: number; redCards: number; }
interface DiscussionDto extends Discussion {}
interface CategoryDto { id: string; name: string; }
interface PageDto<T> { content: T[]; }
interface NotificationPageDto extends PageDto<ChampionshipNotification> { unreadCount: number; }
export interface ShareDto { publicUrl: string; shortUrl?: string; }
interface ReportDto extends ForumReport {}
export interface AdminUser { id: string; username: string; displayName: string; roles: string[]; }

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function readCookie(name: string): string | undefined {
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=");
}

async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const method = (init.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const cookieToken = readCookie("XSRF-TOKEN");
    if (cookieToken) headers.set(csrfHeader, decodeURIComponent(cookieToken));
    else if (csrfToken) headers.set(csrfHeader, csrfToken);
  }
  const response = await fetch(`${apiBase}${path}`, { ...init, headers, credentials: "include" });
  if (response.status === 401 && accessToken && !retried && !path.startsWith("/auth/")) {
    await refreshSession();
    return request<T>(path, init, true);
  }
  if (!response.ok) {
    let message = `Erreur serveur (${response.status}).`;
    try {
      const body = await response.json() as ApiErrorBody;
      message = body.message ?? body.detail ?? message;
    } catch {
      if (response.statusText) message = response.statusText;
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function ensureCsrf(): Promise<void> {
  const result = await request<{ token: string; headerName: string }>("/auth/csrf");
  csrfToken = result.token;
  csrfHeader = result.headerName;
}

async function refreshSession(): Promise<AuthenticatedUser | null> {
  try {
    //await ensureCsrf();
    const result = await request<TokenResponse>("/auth/refresh", { method: "POST" });
    accessToken = result.accessToken;
    authenticatedUser = result.user;
    return result.user;
  } catch (error) {
    if (error instanceof ApiError && [401, 403].includes(error.status)) {
      accessToken = null;
      return null;
    }
    throw error;
  }
}

function mapEvent(event: EventDto, matchId: string): MatchEvent {
  return { id: event.id, matchId, type: event.type, minute: event.minute, occurredAt: event.occurredAt, sequence: event.sequence, teamId: event.teamId, playerId: event.playerId, relatedPlayerId: event.relatedPlayerId };
}

function mapMatch(dto: MatchDto, events: MatchEvent[] = []): Match {
  return { id: dto.id, groupId: dto.groupId ?? "", homeTeamId: dto.homeTeamId, awayTeamId: dto.awayTeamId, startsAt: dto.startsAt, venue: dto.venue ?? "", status: dto.status, homeScore: dto.homeScore, awayScore: dto.awayScore, minute: dto.minute, assignedManagerIds: [], events };
}

function mapChampionship(dto: CompetitionDto): Championship {
  return { id: dto.id, name: dto.name, edition: dto.edition, description: dto.description, locality: dto.locality, startDate: dto.startDate, endDate: dto.endDate, publicUrl: dto.publicUrl, format: dto.format };
}

function mapDiscussion(dto: DiscussionDto): Discussion {
  return { ...dto, replies: dto.replies.map((reply): DiscussionReply => ({ ...reply })) };
}

function emptyData(): TikiScoreData {
  return {
    championship: { id: "", name: "", edition: "", description: "", locality: "", startDate: "", endDate: "", publicUrl: "/", format: "" },
    groups: [], teams: [], players: [], matches: [], standings: [], leaderboard: [],
    statistics: { matchesPlayed: 0, goalsScored: 0, teamsCount: 0, playersCount: 0 },
    announcements: [], notifications: [], discussions: [], reports: [], demoPersonas: [], forumCategories: [], forumPublic: false,
  };
}

export const tikiScoreApi = {
  get accessToken(): string | null { return accessToken; },
  set accessToken(value: string | null) { accessToken = value; },

  async signIn(username: string, password: string): Promise<AuthenticatedUser> {
    //await ensureCsrf();
    const result = await request<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
    accessToken = result.accessToken;
    authenticatedUser = result.user;
    return result.user;
  },
  async register(username: string, displayName: string, password: string): Promise<AuthenticatedUser> {
    //await ensureCsrf();
    const result = await request<TokenResponse>("/auth/register", { method: "POST", body: JSON.stringify({ username, displayName, password }) });
    accessToken = result.accessToken;
    authenticatedUser = result.user;
    console.log("User Authentifié est : ", authenticatedUser)
    return result.user;
  },
  async restoreSession(): Promise<AuthenticatedUser | null> {
    //await ensureCsrf();
    authenticatedUser = await refreshSession();
    return authenticatedUser;
  },
  async signOut(): Promise<void> {
    await request<void>("/auth/logout", { method: "POST" });
    accessToken = null;
    authenticatedUser = null;
  },
  async getCurrentUser(): Promise<AuthenticatedUser> { return request("/users/me"); },
  async updateProfile(input: { displayName: string }): Promise<AuthenticatedUser> {
    return request("/users/me", { method: "PATCH", body: JSON.stringify(input) });
  },
  async updateChampionship(input: { name?: string; edition?: string; description?: string; locality?: string; forumPublic?: boolean; format?: string }): Promise<void> {
    await request("/admin/competition", { method: "PATCH", body: JSON.stringify(input) });
  },
  async getPublicData(): Promise<TikiScoreData> {
    const [competition, groups, teams, matchDtos, standingDtos, scorers, assists, cards, statistics, announcements, forumCategories, share, discussionsPage] = await Promise.all([
      request<CompetitionDto>("/public/competition"),
      request<GroupDto[]>("/public/groups"),
      request<TeamDto[]>("/public/teams"),
      request<MatchDto[]>("/public/matches"),
      request<StandingDto[]>("/public/standings"),
      request<PlayerStatisticDto[]>("/public/statistics/top-scorers"),
      request<PlayerStatisticDto[]>("/public/statistics/top-assists"),
      request<PlayerStatisticDto[]>("/public/statistics/cards"),
      request<ChampionshipStatistics>("/public/statistics/overview"),
      request<Announcement[]>("/public/announcements"),
      request<CategoryDto[]>("/public/forum/categories"),
      request<ShareDto>("/public/competition/share"),
      request<{ content: DiscussionDto[] }>("/public/forum/discussions?page=0&size=100"),
    ]);
    const playersPerTeam = await Promise.all(teams.map((team) => request<PlayerDto[]>(`/public/teams/${team.id}/players`)));
    const players = playersPerTeam.flat();
    const eventsPerMatch = await Promise.all(matchDtos.map((match) => request<EventDto[]>(`/public/matches/${match.id}/events`)));
    const matches = matchDtos.map((match, index) => mapMatch(match, eventsPerMatch[index].filter((event) => event.state === "ACTIVE").map((event) => mapEvent(event, match.id))));
    const leaderboardByPlayer = new Map<string, LeaderboardEntry>();
    for (const row of [...scorers, ...assists, ...cards]) {
      const existing = leaderboardByPlayer.get(row.playerId) ?? { playerId: row.playerId, teamId: row.teamId, goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
      leaderboardByPlayer.set(row.playerId, { ...existing, goals: Math.max(existing.goals, row.goals), assists: Math.max(existing.assists, row.assists), yellowCards: Math.max(existing.yellowCards, row.yellowCards), redCards: Math.max(existing.redCards, row.redCards) });
    }
    const mappedAnnouncements: Announcement[] = announcements.map((item) => ({ ...item, publishedAt: item.publishedAt ?? "", priority: item.priority === "important" ? "important" : "normal", official: true }));
    return {
      ...emptyData(), groups, teams, players,
      matches, standings: standingDtos, leaderboard: [...leaderboardByPlayer.values()], statistics,
      announcements: mappedAnnouncements, discussions: discussionsPage.content.map(mapDiscussion), forumPublic: competition.forumPublic,
      forumCategories, championship: { ...mapChampionship(competition), publicUrl: share.publicUrl },
    };
  },
  async getPrivateData(): Promise<Pick<TikiScoreData, "notifications" | "reports"> & { matches?: Match[] }> {
    const notifications = authenticatedUser?.permissions.includes("notifications:manage")
      ? (await request<NotificationPageDto>("/notifications?page=0&size=50")).content
      : [];
    const reports = authenticatedUser?.permissions.includes("forum:moderate")
      ? await request<ReportDto[]>("/moderation/reports")
      : [];
    const hasMatchPermission = Boolean(authenticatedUser?.permissions.includes("match:manage:assigned"));
    const assignedDtos = hasMatchPermission
      ? await request<MatchDto[]>("/match-manager/matches")
      : [];
    const assignedEventLists = await Promise.all(assignedDtos.map((match) => this.getEvents(match.id)));
    const matches = assignedDtos.map((match, index) => ({
      ...mapMatch(match, assignedEventLists[index]),
      assignedManagerIds: authenticatedUser ? [authenticatedUser.id] : [],
    }));
    return { notifications, reports, ...(hasMatchPermission ? { matches } : {}) };
  },
  async getMatch(matchId: string): Promise<Match> {
    const [match, events] = await Promise.all([
      request<MatchDto>(`/public/matches/${matchId}`),
      this.getEvents(matchId),
    ]);
    return mapMatch(match, events);
  },
  async getForumCategories(): Promise<CategoryDto[]> {
    return request("/public/forum/categories");
  },
  async getAdminUsers(): Promise<AdminUser[]> {
    return request("/admin/users");
  },
  async createMatch(input: { startsAt: string; venue: string; groupId?: string; homeTeamId: string; awayTeamId: string }): Promise<void> {
    await request("/admin/matches", { method: "POST", body: JSON.stringify(input) });
  },
  async createTeam(input: Omit<Team, "id">): Promise<void> {
    await request("/admin/teams", { method: "POST", body: JSON.stringify({ name: input.name, shortName: input.shortName, locality: input.locality, primaryColor: input.primaryColor, secondaryColor: input.secondaryColor, groupId: input.groupId || null }) });
  },
  async createPlayer(input: Omit<Player, "id">): Promise<void> {
    await request(`/admin/teams/${input.teamId}/players`, { method: "POST", body: JSON.stringify({ displayName: input.displayName, jerseyNumber: input.jerseyNumber, position: "ATTAQUANT" }) });
  },
  async createGroup(name: string): Promise<void> {
    await request("/admin/groups", { method: "POST", body: JSON.stringify({ name }) });
  },
  async assignManagers(matchId: string, managerIds: string[]): Promise<void> {
    await request(`/admin/matches/${matchId}/assign-manager`, { method: "POST", body: JSON.stringify({ managerIds }) });
  },
  async updateNotificationPreferences(input: { matchReminders: boolean; matchStartEnd: boolean; goals: boolean; scheduleChanges: boolean; announcements: boolean; forumReplies: boolean }): Promise<void> {
    await request("/users/me/notification-preferences", { method: "PATCH", body: JSON.stringify(input) });
  },
  async getNotificationPreferences(): Promise<{ matchReminders: boolean; matchStartEnd: boolean; goals: boolean; scheduleChanges: boolean; announcements: boolean; forumReplies: boolean }> {
    return request("/users/me/notification-preferences");
  },
  async createAnnouncement(input: Pick<Announcement, "title" | "excerpt" | "body" | "priority">): Promise<void> {
    const created = await request<{ id: string }>("/admin/announcements", { method: "POST", body: JSON.stringify({ ...input, showOnHome: input.priority === "important" }) });
    await request(`/admin/announcements/${created.id}/publish`, { method: "POST" });
  },
  async updateForumState(discussionId: string, state: { pinned?: boolean; closed?: boolean; hidden?: boolean }): Promise<void> {
    if (state.pinned !== undefined) await request(`/moderation/discussions/${discussionId}/pin?pinned=${state.pinned}`, { method: "POST" });
    if (state.closed !== undefined) await request(`/moderation/discussions/${discussionId}/close?closed=${state.closed}`, { method: "POST" });
    if (state.hidden !== undefined) await request(`/moderation/posts/${discussionId}/hide?discussionId=${discussionId}`, { method: "POST" });
  },
  async resolveReport(id: string): Promise<void> { await request(`/moderation/reports/${id}/resolve`, { method: "POST" }); },
  async getEvents(matchId: string, afterSequence = 0): Promise<MatchEvent[]> {
    const events = await request<EventDto[]>(`/public/matches/${matchId}/events?afterSequence=${afterSequence}`);
    return events.filter((event) => event.state === "ACTIVE").map((event) => mapEvent(event, matchId));
  },
  async startMatch(id: string): Promise<void> { await request(`/match-manager/matches/${id}/start`, { method: "POST" }); },
  async halfTime(id: string): Promise<void> { await request(`/match-manager/matches/${id}/half-time`, { method: "POST" }); },
  async resumeMatch(id: string): Promise<void> { await request(`/match-manager/matches/${id}/resume`, { method: "POST" }); },
  async pauseMatch(id: string): Promise<void> { await request(`/match-manager/matches/${id}/pause`, { method: "POST" }); },
  async finishMatch(id: string): Promise<void> { await request(`/match-manager/matches/${id}/finish`, { method: "POST" }); },
  async recordEvent(matchId: string, event: MatchEventInput): Promise<void> {
    const types: Record<MatchEventInput["type"], string> = { goal: "goal", yellowCard: "yellowCard", redCard: "redCard", substitution: "substitution", periodStart: "periodStart", halftime: "halftime", periodResume: "periodResume", fullTime: "fullTime" };
    await request(`/match-manager/matches/${matchId}/events`, { method: "POST", body: JSON.stringify({ clientEventId: crypto.randomUUID(), type: types[event.type], minute: event.minute, addedTime: 0, teamId: event.teamId ?? null, playerId: event.playerId ?? null, relatedPlayerId: event.relatedPlayerId ?? null }) });
  },
  async cancelEvent(matchId: string, eventId: string): Promise<void> { await request(`/match-manager/matches/${matchId}/events/${eventId}/cancel`, { method: "POST" }); },
  async createDiscussion(categoryId: string, title: string, body: string): Promise<Discussion> {
    const dto = await request<DiscussionDto>("/forum/discussions", { method: "POST", body: JSON.stringify({ categoryId, title, body }) });
    return mapDiscussion(dto);
  },
  async reply(discussionId: string, body: string): Promise<DiscussionReply> {
    return request(`/forum/discussions/${discussionId}/replies`, { method: "POST", body: JSON.stringify({ body }) });
  },
  async report(postId: string, reason: string): Promise<ForumReport> {
    return request(`/forum/posts/${postId}/reports`, { method: "POST", body: JSON.stringify({ reason }) });
  },
  async markNotificationRead(id: string): Promise<void> { await request(`/notifications/${id}/read`, { method: "PATCH" }); },
  async markAllNotificationsRead(): Promise<void> { await request("/notifications/read-all", { method: "POST" }); },
  async getNotifications(): Promise<NotificationPageDto> { return request("/notifications?page=0&size=50"); },
  async getShare(): Promise<ShareDto> { return request("/public/competition/share"); },
};
