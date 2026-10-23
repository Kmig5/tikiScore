import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Radio, Share2 } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import Badge from "../composants/ui/Badge";
import Button from "../composants/ui/Button";
import Select from "../composants/ui/Select";
import { useDemoAccess } from "../app/useDemoAccess";
import { useLiveMatchMinute, useTikiScoreData } from "../app/hooks";
import { apiLiveTransport, type LiveConnectionStatus } from "../services/liveTransport";
import { tikiScoreService } from "../services/tikiScoreService";
import type { MatchStatus } from "../domain/types";
import { hasPermission } from "../domain/permissions";
import { useToast } from "../contexts/useToast";
import { PageHeader, SectionHeading, EmptyState, MatchCard, StandingList, LeaderboardList, TeamMark } from "./shared";
import styles from "./pages.module.css";

export function HomePage() {
  const data = useTikiScoreData();
  const { success, error } = useToast();
  const liveMatch = data.matches.find((match) => match.status === "live" || match.status === "halftime");
  const upcoming = data.matches.filter((match) => match.status === "scheduled").sort((first, second) => first.startsAt.localeCompare(second.startsAt)).slice(0, 2);
  const priority = data.announcements.find((announcement) => announcement.priority === "important");
  const firstGroup = data.groups[0];

  async function shareChampionship() {
    const url = `${window.location.origin}/`;
    if (navigator.share) {
      try {
        await navigator.share({ title: data.championship.name, text: `Suivez ${data.championship.name}`, url });
      } catch (shareError) {
        if (shareError instanceof Error && shareError.name !== "AbortError") error("Le partage n’a pas abouti.");
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      success("Lien public copié.");
    } catch {
      error("Copie indisponible dans ce navigateur.");
    }
  }

  return <div className={styles.page}>
    <PageHeader eyebrow={data.championship.edition} title={data.championship.name} description={`${data.championship.description} · ${data.championship.locality}`} action={<Button variant="secondary" onClick={shareChampionship}><Share2 size={16} aria-hidden="true" />Partager</Button>} />
    <section className={styles.section}>
      <SectionHeading title="En direct" to={liveMatch ? `/matchs/${liveMatch.id}` : "/matchs"} linkLabel="Tous les matchs" />
      {liveMatch ? <MatchCard match={liveMatch} /> : <EmptyState title="Aucun match en direct" body="Les rencontres en cours apparaîtront ici." />}
    </section>
    <section className={styles.section}>
      <SectionHeading title="Prochaines rencontres" to="/matchs" />
      {upcoming.length ? <div className={styles.matchGrid}>{upcoming.map((match) => <MatchCard key={match.id} match={match} />)}</div> : <EmptyState title="Calendrier à venir" body="Les prochains matchs seront affichés dès leur programmation." />}
    </section>
    <section className={styles.section}>
      <SectionHeading title="Communiqué officiel" to="/communiques" />
      {priority ? <article className={styles.announcement}>
        <div className={styles.announcementHeader}><h3>{priority.title}</h3><Badge variant="info">Officiel</Badge></div>
        <p>{priority.excerpt}</p>
        <Link className={styles.textLink} to="/communiques">Lire le communiqué<ArrowRight size={15} aria-hidden="true" /></Link>
      </article> : <EmptyState title="Aucun communiqué prioritaire" body="Les informations officielles du championnat seront publiées ici." />}
    </section>
    <div className={styles.twoColumn}>
      <section className={styles.section}>
        <SectionHeading title={`Classement · ${firstGroup?.name ?? "Poule"}`} to="/classements" />
        {firstGroup && <StandingList compact standings={data.standings.filter((standing) => standing.groupId === firstGroup.id).slice(0, 4)} />}
      </section>
      <section className={styles.section}>
        <SectionHeading title="Meilleurs buteurs" to="/classements/buteurs" />
        <LeaderboardList limit={4} />
      </section>
    </div>
    <section className={styles.section}>
      <SectionHeading title="Dans la communauté" to="/communaute" />
      <div className={styles.list}>{data.discussions.filter((discussion) => !discussion.hidden).slice(0, 2).map((discussion) => <Link className={styles.discussion} key={discussion.id} to={`/communaute/${discussion.id}`}>
        <span className={styles.discussionMeta}>{discussion.pinned && <Badge variant="warning" size="small">Épinglé</Badge>}{discussion.category} · {discussion.replies.length} réponse{discussion.replies.length === 1 ? "" : "s"}</span>
        <h3>{discussion.title}</h3><p>{discussion.body}</p>
      </Link>)}</div>
    </section>
    <section className={styles.panel}>
      <SectionHeading title="Faites circuler le tournoi" to="/gestion/partage" linkLabel="Ouvrir le partage" />
      <p className={styles.contentText}>Retrouvez le lien public et le QR code du championnat.</p>
    </section>
  </div>;
}

export function MatchesPage() {
  const data = useTikiScoreData();
  const [filter, setFilter] = useState<"all" | "upcoming" | "results" | "live">("all");
  const filtered = useMemo(() => data.matches.filter((match) => {
    if (filter === "upcoming") return match.status === "scheduled";
    if (filter === "results") return match.status === "finished";
    if (filter === "live") return match.status === "live" || match.status === "halftime";
    return true;
  }).sort((first, second) => first.startsAt.localeCompare(second.startsAt)), [data.matches, filter]);
  const filters = [{ id: "all", label: "Tous" }, { id: "upcoming", label: "À venir" }, { id: "results", label: "Résultats" }, { id: "live", label: "En direct" }] as const;

  return <div className={styles.page}>
    <PageHeader eyebrow="Compétition" title="Matchs" description="Calendrier, résultats et suivi des rencontres." />
    <div className={styles.tabs} role="tablist" aria-label="Filtrer les matchs">
      {filters.map((item) => <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} className={`${styles.tab} ${filter === item.id ? styles.tabActive : ""}`} onClick={() => setFilter(item.id)}>{item.label}</button>)}
    </div>
    {filtered.length ? <div className={styles.matchGrid}>{filtered.map((match) => <MatchCard key={match.id} match={match} />)}</div> : <EmptyState title="Aucun match dans cette sélection" body="Choisissez un autre filtre ou revenez plus tard." />}
  </div>;
}

function eventDescription(event: { type: string; teamId?: string; playerId?: string; relatedPlayerId?: string; note?: string }, data: ReturnType<typeof useTikiScoreData>) {
  const player = data.players.find((entry) => entry.id === event.playerId)?.displayName;
  const team = data.teams.find((entry) => entry.id === event.teamId)?.name;
  const related = data.players.find((entry) => entry.id === event.relatedPlayerId)?.displayName;
  if (event.type === "goal") return `But${player ? ` de ${player}` : ""}${team ? ` · ${team}` : ""}${related ? ` · passe de ${related}` : ""}`;
  if (event.type === "yellowCard") return `Carton jaune${player ? ` · ${player}` : ""}`;
  if (event.type === "redCard") return `Carton rouge${player ? ` · ${player}` : ""}`;
  if (event.type === "substitution") return `Remplacement${player ? ` · entrée de ${player}` : ""}${related ? ` · sortie de ${related}` : ""}`;
  if (event.type === "halftime") return "Mi-temps";
  if (event.type === "periodResume") return "Reprise du match";
  if (event.type === "fullTime") return "Fin du match";
  return event.note ?? "Début de la rencontre";
}

export function MatchDetailPage() {
  const { matchId = "" } = useParams();
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  const match = data.matches.find((candidate) => candidate.id === matchId);
  const liveMinute = useLiveMatchMinute(match);
  const [liveConnection, setLiveConnection] = useState<LiveConnectionStatus>("disconnected");
  useEffect(() => {
    if (!match || (match.status !== "live" && match.status !== "halftime")) return;
    return apiLiveTransport.connect(match.id, setLiveConnection, () => {
      void tikiScoreService.refreshMatch(match.id).catch((error: unknown) => console.error("Impossible de synchroniser le match.", error));
    });
  }, [match?.id, match?.status]);
  if (!match) return <div className={styles.page}><PageHeader title="Match introuvable" /><EmptyState title="Cette rencontre n’existe pas" body="Elle a peut-être été déplacée ou supprimée." action={<Link to="/matchs"><Button variant="secondary">Retour aux matchs</Button></Link>} /></div>;
  const home = data.teams.find((team) => team.id === match.homeTeamId);
  const away = data.teams.find((team) => team.id === match.awayTeamId);
  const canManage = hasPermission(permissions, "match:manage:assigned") && (match.assignedManagerIds.includes("manager-demo") || hasPermission(permissions, "competition:manage"));
  const status = match.status === "live" || match.status === "halftime" ? "Direct" : match.status === "finished" ? "Terminé" : match.status === "postponed" ? "Reporté" : match.status === "cancelled" ? "Annulé" : "À venir";

  return <div className={styles.page}>
    <PageHeader eyebrow={match.groupId.replace("group-", "Poule ")} title={`${home?.name ?? "Équipe"} · ${away?.name ?? "Équipe"}`} description={`${new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(new Date(match.startsAt))} · ${match.venue}`} action={canManage ? <Link to={`/gestion/matchs/${match.id}/live`}><Button><Radio size={16} aria-hidden="true" />Ouvrir la console</Button></Link> : undefined} />
    <div className={styles.consoleScore}>
      <div className={styles.consoleTeam}><TeamMark teamId={match.homeTeamId} large /><span>{home?.name}</span></div>
      <strong className={styles.consoleScoreValue}>{match.homeScore ?? "–"}<span style={{ fontSize: 20, color: "#91a097" }}> : </span>{match.awayScore ?? "–"}</strong>
      <div className={styles.consoleTeam}><TeamMark teamId={match.awayTeamId} large /><span>{away?.name}</span></div>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center" }}><Badge variant={match.status === "live" ? "live" : "neutral"} dot={match.status === "live"}>{status}{match.status === "live" || match.minute !== undefined ? ` · ${liveMinute}′` : ""}</Badge></div>
    </div>
    {(match.status === "live" || match.status === "halftime") && <div className={styles.liveConnection} role="status"><Radio size={16} aria-hidden="true" /><span>{liveConnection === "connected" ? "Direct synchronisé avec le serveur." : liveConnection === "reconnecting" ? "Reconnexion au direct…" : "Connexion au direct arrêtée."}</span></div>}
    <div className={styles.detailGrid}>
      <section className={styles.section}><SectionHeading title="Chronologie" />{match.events.length ? <div className={styles.eventCompartments} aria-label={`Événements, ${home?.name ?? "équipe à domicile"} contre ${away?.name ?? "équipe visiteuse"}`}><div className={styles.eventTeamHeading}>{home?.name ?? "Domicile"}</div><div className={styles.eventTeamHeading}>{away?.name ?? "Extérieur"}</div>{[...match.events].sort((first, second) => first.minute - second.minute || first.occurredAt.localeCompare(second.occurredAt)).map((event, index) => <div className={`${styles.compartmentEvent} ${event.teamId === match.awayTeamId ? styles.awayEvent : event.teamId === match.homeTeamId ? styles.homeEvent : styles.neutralEvent}`} style={{ gridRow: index + 2 }} key={event.id}><strong>{event.minute}′</strong><span>{eventDescription(event, data)}</span></div>)}</div> : <EmptyState title="Aucun événement" body="Les événements du match apparaîtront ici." />}</section>
      <aside className={styles.panel}><h2 className={styles.panelTitle}>Informations</h2><p className={styles.contentText}>{status} · {match.venue}</p><div className={styles.spacer} /><p className={styles.dataNote}>Les résultats, événements et classements officiels seront fournis par l’API du championnat.</p></aside>
    </div>
  </div>;
}

const rankingTabs = [
  { to: "/classements", label: "Équipes" },
  { to: "/classements/buteurs", label: "Buteurs" },
  { to: "/classements/passeurs", label: "Passeurs" },
  { to: "/classements/cartons", label: "Cartons" },
  { to: "/statistiques", label: "Stats" },
];

export function StandingsPage({ type = "teams" }: { type?: "teams" | "goals" | "assists" | "cards" }) {
  const data = useTikiScoreData();
  const location = useLocation();
  const [groupId, setGroupId] = useState(() => window.localStorage.getItem("tikiscore-ranking-group") ?? "all");
  const selectedGroup = data.groups.find((group) => group.id === groupId);
  const title = type === "teams" ? "Classements" : type === "goals" ? "Classement des buteurs" : type === "assists" ? "Classement des passeurs" : "Classement des cartons";
  const filteredStandings = data.standings.filter((standing) => groupId === "all" || standing.groupId === groupId);
  const filteredLeaderboard = data.leaderboard.filter((entry) => groupId === "all" || data.teams.find((team) => team.id === entry.teamId)?.groupId === groupId);

  return <div className={styles.page}>
    <PageHeader eyebrow="Compétition" title={title} description="Données de démonstration, en attente des classements calculés par le serveur." />
    <nav className={styles.tabs} aria-label="Types de classement">{rankingTabs.map((tab) => <Link key={tab.to} to={tab.to} aria-current={tab.to === location.pathname ? "page" : undefined} className={`${styles.tab} ${tab.to === location.pathname ? styles.tabActive : ""}`}>{tab.label}</Link>)}</nav>
    <div className={styles.filterRow}><label htmlFor="group-filter">Poule</label><Select id="group-filter" label="Poule" options={[{ value: "all", label: "Classement global · toutes les poules" }, ...data.groups.map((group) => ({ value: group.id, label: group.name }))]} value={groupId} onChange={(event) => { setGroupId(event.target.value); window.localStorage.setItem("tikiscore-ranking-group", event.target.value); }} fullWidth={false} /></div>
    {type === "teams" ? filteredStandings.length ? <section className={styles.panel}><h2 className={styles.panelTitle}>{selectedGroup?.name ?? "Classement global"}</h2><StandingList standings={filteredStandings} /></section> : <EmptyState title="Aucun classement disponible" body="Les classements apparaîtront dès que les données du serveur seront disponibles." /> : <section className={styles.panel}><h2 className={styles.panelTitle}>{selectedGroup?.name ?? "Classement global"}</h2><LeaderboardList metric={type} limit={filteredLeaderboard.length} entries={filteredLeaderboard} /></section>}
  </div>;
}

export function StatisticsPage() {
  const data = useTikiScoreData();
  const location = useLocation();
  const stats = data.statistics;
  return <div className={styles.page}>
    <PageHeader eyebrow="Compétition" title="Statistiques" description="Indicateurs fournis par les données de démonstration. Les calculs officiels dépendront de l’API." />
    <nav className={styles.tabs} aria-label="Types de classement">{rankingTabs.map((tab) => <Link key={tab.to} to={tab.to} aria-current={tab.to === location.pathname ? "page" : undefined} className={`${styles.tab} ${tab.to === location.pathname ? styles.tabActive : ""}`}>{tab.label}</Link>)}</nav>
    <div className={styles.metricGrid}>
      <div className={styles.metric}><span>Matchs joués</span><strong>{stats.matchesPlayed}</strong></div>
      <div className={styles.metric}><span>Buts inscrits</span><strong>{stats.goalsScored}</strong></div>
      <div className={styles.metric}><span>Équipes</span><strong>{stats.teamsCount}</strong></div>
      <div className={styles.metric}><span>Joueurs inscrits</span><strong>{stats.playersCount}</strong></div>
    </div>
    <section className={styles.section}><SectionHeading title="Répartition des rencontres" /><div className={styles.panel}><div className={styles.standingsList}>{(["scheduled", "live", "finished", "postponed"] as MatchStatus[]).map((status) => <div className={styles.standingRow} key={status}><span style={{ textAlign: "left" }}>{status === "scheduled" ? "À venir" : status === "live" ? "En direct" : status === "finished" ? "Terminés" : "Reportés"}</span><span>{data.matches.filter((match) => match.status === status).length}</span><span /><strong>{data.matches.filter((match) => match.status === status).length}</strong></div>)}</div><p className={styles.dataNote}>Comptages issus du calendrier de démonstration chargé dans cette session.</p></div></section>
  </div>;
}

export function AnnouncementsPage() {
  const data = useTikiScoreData();
  return <div className={styles.page}>
    <PageHeader eyebrow="Informations officielles" title="Communiqués" description="Les informations publiées par l’organisation du championnat." />
    {data.announcements.length ? <div className={styles.list}>{data.announcements.map((announcement) => <article className={styles.announcement} key={announcement.id}>
      <div className={styles.announcementHeader}><h3>{announcement.title}</h3><Badge variant={announcement.priority === "important" ? "warning" : "info"}>Officiel</Badge></div>
      <p>{announcement.body}</p><span className={styles.announcementMeta}>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(announcement.publishedAt))} · Publication officielle</span>
    </article>)}</div> : <EmptyState title="Aucun communiqué publié" body="Les informations officielles apparaîtront ici." />}
  </div>;
}