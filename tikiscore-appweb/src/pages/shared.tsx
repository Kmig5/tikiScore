import type { ReactNode } from "react";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "../composants/ui/Badge";
import Button from "../composants/ui/Button";
import type { Match, Standing } from "../domain/types";
import { useTikiScoreData } from "../app/hooks";
import styles from "./pages.module.css";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className={styles.pageHeader}>
    <div>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h1 className={styles.pageTitle}>{title}</h1>
      {description && <p className={styles.pageDescription}>{description}</p>}
    </div>
    {action && <div className={styles.pageAction}>{action}</div>}
  </div>;
}

export function SectionHeading({ title, to, linkLabel = "Tout voir" }: { title: string; to?: string; linkLabel?: string }) {
  return <div className={styles.sectionHeading}>
    <h2>{title}</h2>
    {to && <Link to={to} className={styles.textLink}>{linkLabel}<ArrowRight size={15} aria-hidden="true" /></Link>}
  </div>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <div className={styles.emptyState}>
    <div className={styles.emptyMark} aria-hidden="true">TS</div>
    <h3>{title}</h3>
    <p>{body}</p>
    {action}
  </div>;
}

export function TeamMark({ teamId, large = false }: { teamId: string; large?: boolean }) {
  const data = useTikiScoreData();
  const team = data.teams.find((entry) => entry.id === teamId);
  if (!team) return <span className={`${styles.teamMark} ${large ? styles.teamMarkLarge : ""}`} aria-hidden="true">?</span>;
  return <span className={`${styles.teamMark} ${large ? styles.teamMarkLarge : ""}`} style={{ color: team.primaryColor, backgroundColor: team.secondaryColor }} aria-label={team.name}>
    {team.shortName.slice(0, 2)}
  </span>;
}

export function MatchCard({ match }: { match: Match }) {
  const data = useTikiScoreData();
  const home = data.teams.find((team) => team.id === match.homeTeamId);
  const away = data.teams.find((team) => team.id === match.awayTeamId);
  const statusLabel = match.status === "live" ? `En direct · ${match.minute ?? 0}′` : match.status === "finished" ? "Terminé" : match.status === "postponed" ? "Reporté" : match.status === "cancelled" ? "Annulé" : new Intl.DateTimeFormat("fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(match.startsAt));

  return <Link className={`${styles.matchCard} ${match.status === "live" ? styles.liveMatch : ""}`} to={`/matchs/${match.id}`}>
    <div className={styles.matchMeta}>
      <span>{match.groupId.replace("group-", "Poule ").toUpperCase()}</span>
      {match.status === "live" ? <Badge variant="live" dot>{statusLabel}</Badge> : <span>{statusLabel}</span>}
    </div>
    <div className={styles.matchTeams}>
      <div className={styles.matchTeam}><TeamMark teamId={match.homeTeamId} /><span>{home?.name ?? "Équipe"}</span></div>
      <strong className={styles.matchScore}>{match.homeScore ?? "–"}<span>:</span>{match.awayScore ?? "–"}</strong>
      <div className={`${styles.matchTeam} ${styles.awayTeam}`}><TeamMark teamId={match.awayTeamId} /><span>{away?.name ?? "Équipe"}</span></div>
    </div>
    <div className={styles.matchVenue}><MapPin size={14} aria-hidden="true" />{match.venue}<span className={styles.matchArrow}><ArrowRight size={15} aria-hidden="true" /></span></div>
  </Link>;
}

export function StandingList({ standings, compact = false }: { standings: Standing[]; compact?: boolean }) {
  const data = useTikiScoreData();
  const sorted = [...standings].sort((first, second) => second.points - first.points || (second.goalsFor - second.goalsAgainst) - (first.goalsFor - first.goalsAgainst) || second.goalsFor - first.goalsFor);
  return <div className={styles.standingsList}>
    <div className={styles.standingHead}><span># / ÉQUIPE</span><span>J</span><span>+/-</span><span>PTS</span></div>
    {sorted.map((standing, index) => {
      const team = data.teams.find((entry) => entry.id === standing.teamId);
      return <div className={styles.standingRow} key={standing.teamId}>
        <span className={styles.standingTeam}><b>{index + 1}</b><TeamMark teamId={standing.teamId} /><strong>{team?.name ?? "Équipe"}</strong></span>
        <span>{standing.played}</span>
        <span>{standing.goalsFor - standing.goalsAgainst > 0 ? "+" : ""}{standing.goalsFor - standing.goalsAgainst}</span>
        <strong>{standing.points}</strong>
      </div>;
    })}
    {!compact && <p className={styles.dataNote}>Classement de démonstration · les classements officiels sont calculés par le serveur.</p>}
  </div>;
}

export function LeaderboardList({ metric = "goals", limit = 5 }: { metric?: "goals" | "assists" | "cards"; limit?: number }) {
  const data = useTikiScoreData();
  const sorted = [...data.leaderboard].sort((first, second) => {
    const value = (entry: typeof first) => metric === "cards" ? entry.yellowCards + entry.redCards * 2 : entry[metric];
    return value(second) - value(first);
  }).slice(0, limit);
  return <div className={styles.leaderboard}>
    {sorted.map((entry, index) => {
      const player = data.players.find((candidate) => candidate.id === entry.playerId);
      const team = data.teams.find((candidate) => candidate.id === entry.teamId);
      const score = metric === "cards" ? `${entry.yellowCards} / ${entry.redCards}` : entry[metric];
      return <div className={styles.leaderRow} key={entry.playerId}>
        <span className={styles.leaderRank}>{String(index + 1).padStart(2, "0")}</span>
        <div className={styles.leaderInfo}><strong>{player?.displayName ?? "Joueur"}</strong><span>{team?.name ?? "Équipe"}</span></div>
        <strong className={styles.leaderScore}>{score}</strong>
      </div>;
    })}
  </div>;
}

export function MatchScheduleMeta({ startsAt, venue }: { startsAt: string; venue: string }) {
  return <div className={styles.scheduleMeta}><span><CalendarDays size={14} aria-hidden="true" />{new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(startsAt))}</span><span><MapPin size={14} aria-hidden="true" />{venue}</span></div>;
}

export function DemoAction({ children, to }: { children: string; to: string }) {
  return <Button variant="secondary" onClick={() => { window.location.href = to; }}>{children}</Button>;
}