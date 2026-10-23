import type { TikiScoreData } from "../../domain/types";

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const at = (dayOffset: number, hour: number, minute = 0) => {
  const date = new Date(today);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};
const publishedAt = (dayOffset: number) => at(dayOffset, 10);

export const demoData: TikiScoreData = {
  championship: {
    id: "championship-demo",
    name: "Trophée des Quartiers",
    edition: "Édition 2026",
    description: "Le rendez-vous sportif et convivial des équipes du quartier.",
    locality: "Port-Lumière",
    startDate: at(-2, 9),
    endDate: at(8, 18),
    publicUrl: "/",
    format: "Football · 2 poules",
  },
  groups: [
    { id: "group-a", name: "Poule A" },
    { id: "group-b", name: "Poule B" },
  ],
  teams: [
    { id: "team-1", name: "Les Alizés", shortName: "ALI", locality: "Nord", primaryColor: "#087e64", secondaryColor: "#e0f2ed", groupId: "group-a" },
    { id: "team-2", name: "Racing du Port", shortName: "RDP", locality: "Port", primaryColor: "#d44b35", secondaryColor: "#fbe9e5", groupId: "group-a" },
    { id: "team-3", name: "Étoile Bleue", shortName: "ETO", locality: "Centre", primaryColor: "#2670a8", secondaryColor: "#e6f1f8", groupId: "group-a" },
    { id: "team-4", name: "Union des Pins", shortName: "UDP", locality: "Est", primaryColor: "#9b6b14", secondaryColor: "#f8f0dc", groupId: "group-a" },
    { id: "team-5", name: "Les Cormorans", shortName: "COR", locality: "Ouest", primaryColor: "#655c94", secondaryColor: "#eeecf7", groupId: "group-b" },
    { id: "team-6", name: "Sporting Soleil", shortName: "SOL", locality: "Sud", primaryColor: "#bf6924", secondaryColor: "#fff0e0", groupId: "group-b" },
    { id: "team-7", name: "Olympique Vert", shortName: "OLV", locality: "Jardin", primaryColor: "#4c8134", secondaryColor: "#eaf3e5", groupId: "group-b" },
    { id: "team-8", name: "Avenir Club", shortName: "AVE", locality: "Rivière", primaryColor: "#405d75", secondaryColor: "#e8eef2", groupId: "group-b" },
  ],
  players: [
    { id: "player-1", displayName: "Joueur 9", jerseyNumber: 9, teamId: "team-1" },
    { id: "player-2", displayName: "Joueur 7", jerseyNumber: 7, teamId: "team-2" },
    { id: "player-3", displayName: "Joueur 10", jerseyNumber: 10, teamId: "team-3" },
    { id: "player-4", displayName: "Joueur 11", jerseyNumber: 11, teamId: "team-5" },
    { id: "player-5", displayName: "Joueur 8", jerseyNumber: 8, teamId: "team-6" },
  ],
  matches: [
    {
      id: "match-live",
      groupId: "group-a",
      homeTeamId: "team-1",
      awayTeamId: "team-2",
      startsAt: at(0, 17, 30),
      venue: "Terrain municipal",
      status: "live",
      homeScore: 2,
      awayScore: 1,
      minute: 68,
      assignedManagerIds: ["manager-demo"],
      events: [
        { id: "event-1", matchId: "match-live", type: "periodStart", minute: 0, occurredAt: at(0, 17, 30) },
        { id: "event-2", matchId: "match-live", type: "goal", minute: 18, occurredAt: at(0, 17, 48), teamId: "team-1", playerId: "player-1" },
        { id: "event-3", matchId: "match-live", type: "goal", minute: 41, occurredAt: at(0, 18, 11), teamId: "team-2", playerId: "player-2" },
        { id: "event-4", matchId: "match-live", type: "goal", minute: 55, occurredAt: at(0, 18, 25), teamId: "team-1", playerId: "player-1" },
      ],
    },
    { id: "match-2", groupId: "group-a", homeTeamId: "team-3", awayTeamId: "team-4", startsAt: at(1, 15), venue: "Terrain municipal", status: "scheduled", assignedManagerIds: ["manager-demo"], events: [] },
    { id: "match-3", groupId: "group-b", homeTeamId: "team-5", awayTeamId: "team-6", startsAt: at(1, 17), venue: "Terrain annexe", status: "scheduled", assignedManagerIds: [], events: [] },
    { id: "match-4", groupId: "group-a", homeTeamId: "team-2", awayTeamId: "team-3", startsAt: at(-1, 16), venue: "Terrain municipal", status: "finished", homeScore: 1, awayScore: 1, assignedManagerIds: [], events: [] },
    { id: "match-5", groupId: "group-b", homeTeamId: "team-7", awayTeamId: "team-8", startsAt: at(2, 15, 30), venue: "Terrain annexe", status: "scheduled", assignedManagerIds: [], events: [] },
    { id: "match-6", groupId: "group-a", homeTeamId: "team-4", awayTeamId: "team-1", startsAt: at(3, 16), venue: "Terrain municipal", status: "scheduled", assignedManagerIds: [], events: [] },
  ],
  standings: [
    { teamId: "team-1", groupId: "group-a", played: 2, wins: 2, draws: 0, losses: 0, goalsFor: 5, goalsAgainst: 2, points: 6 },
    { teamId: "team-2", groupId: "group-a", played: 3, wins: 1, draws: 1, losses: 1, goalsFor: 5, goalsAgainst: 4, points: 4 },
    { teamId: "team-3", groupId: "group-a", played: 2, wins: 0, draws: 1, losses: 1, goalsFor: 2, goalsAgainst: 3, points: 1 },
    { teamId: "team-4", groupId: "group-a", played: 1, wins: 0, draws: 0, losses: 1, goalsFor: 1, goalsAgainst: 4, points: 0 },
    { teamId: "team-5", groupId: "group-b", played: 2, wins: 1, draws: 1, losses: 0, goalsFor: 4, goalsAgainst: 2, points: 4 },
    { teamId: "team-6", groupId: "group-b", played: 2, wins: 1, draws: 0, losses: 1, goalsFor: 3, goalsAgainst: 4, points: 3 },
    { teamId: "team-7", groupId: "group-b", played: 1, wins: 0, draws: 1, losses: 0, goalsFor: 2, goalsAgainst: 2, points: 1 },
    { teamId: "team-8", groupId: "group-b", played: 1, wins: 0, draws: 0, losses: 1, goalsFor: 1, goalsAgainst: 2, points: 0 },
  ],
  leaderboard: [
    { playerId: "player-1", teamId: "team-1", goals: 3, assists: 1, yellowCards: 0, redCards: 0 },
    { playerId: "player-2", teamId: "team-2", goals: 2, assists: 1, yellowCards: 1, redCards: 0 },
    { playerId: "player-3", teamId: "team-3", goals: 2, assists: 0, yellowCards: 0, redCards: 0 },
    { playerId: "player-4", teamId: "team-5", goals: 1, assists: 2, yellowCards: 0, redCards: 0 },
    { playerId: "player-5", teamId: "team-6", goals: 1, assists: 1, yellowCards: 1, redCards: 0 },
  ],
  statistics: { matchesPlayed: 0, goalsScored: 0, teamsCount: 8, playersCount: 5 },
  announcements: [
    { id: "announcement-1", title: "Bienvenue au Trophée des Quartiers", excerpt: "Le tournoi est lancé : retrouvez le calendrier et les résultats ici.", body: "Bienvenue à toutes les équipes et à leurs supporters. Le calendrier est disponible et sera mis à jour par l’organisation.", publishedAt: publishedAt(-2), priority: "important", official: true },
    { id: "announcement-2", title: "Accès aux terrains", excerpt: "Les rencontres se jouent au terrain municipal et sur le terrain annexe.", body: "Merci de respecter les horaires indiqués au calendrier.", publishedAt: publishedAt(-1), priority: "normal", official: true },
  ],
  notifications: [
    { id: "notification-1", title: "Match en cours", message: "Les Alizés mènent 2–1 face au Racing du Port.", createdAt: at(0, 18, 25), category: "match", read: false },
    { id: "notification-2", title: "Prochain match demain", message: "Étoile Bleue contre Union des Pins à 15 h.", createdAt: at(0, 12), category: "schedule", read: false },
    { id: "notification-3", title: "Nouveau communiqué", message: "Les informations d’accès aux terrains sont disponibles.", createdAt: publishedAt(-1), category: "announcement", read: true },
  ],
  discussions: [
    { id: "discussion-1", category: "Vie du tournoi", title: "Les meilleurs souvenirs du premier week-end", body: "Quel moment vous a le plus marqué sur les terrains ?", authorName: "Supporter du tournoi", createdAt: publishedAt(-1), replies: [{ id: "reply-1", authorName: "Supporter des Alizés", body: "La dernière action du match d’ouverture !", createdAt: publishedAt(0), hidden: false }], pinned: true, closed: false, hidden: false },
    { id: "discussion-2", category: "Organisation", title: "Covoiturage pour les matchs de demain", body: "Un fil pour organiser les trajets vers le terrain annexe.", authorName: "Membre du forum", createdAt: publishedAt(0), replies: [], pinned: false, closed: false, hidden: false },
  ],
  forumCategories: [],
  reports: [],
  demoPersonas: [
    { id: "visitor", label: "Visiteur" },
    { id: "member", label: "Membre (aperçu)" },
    { id: "matchManager", label: "Gestionnaire (aperçu)" },
    { id: "moderator", label: "Modérateur (aperçu)" },
    { id: "administrator", label: "Administrateur (aperçu)" },
  ],
  forumPublic: true,
};

demoData.statistics = {
  matchesPlayed: demoData.matches.filter((match) => match.status === "finished").length,
  goalsScored: demoData.matches.filter((match) => match.status === "finished").reduce((total, match) => total + (match.homeScore ?? 0) + (match.awayScore ?? 0), 0),
  teamsCount: demoData.teams.length,
  playersCount: demoData.players.length,
};