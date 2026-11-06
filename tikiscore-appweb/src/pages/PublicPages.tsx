import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Radio, RotateCcw, Share2, Star } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Badge from "../composants/ui/Badge";
import Button from "../composants/ui/Button";
import Select from "../composants/ui/Select";
import { useDemoAccess } from "../app/useDemoAccess";
import { useLiveMatchMinute, useTikiScoreData } from "../app/hooks";
import { resolvePublicUrl } from "../app/publicUrl";
import { apiLiveTransport, type LiveConnectionStatus } from "../services/liveTransport";
import { tikiScoreService } from "../services/tikiScoreService";
import type { MatchStatus, PlayerPosition } from "../domain/types";
import { hasPermission } from "../domain/permissions";
import { tikiScoreApi, type MatchRatingData } from "../services/api";
import { setActiveChampionshipId } from "../services/api";
import { useToast } from "../contexts/useToast";
import { PageHeader, SectionHeading, EmptyState, MatchCard, StandingList, LeaderboardList, TeamMark } from "./shared";
import styles from "./pages.module.css";

export function HomePage({ createOnly = false }: { createOnly?: boolean }) {
  const data = useTikiScoreData();
  const { user, refreshCurrentUser } = useDemoAccess();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [name, setName] = useState("");
  const [edition, setEdition] = useState("");
  const [locality, setLocality] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("GROUPES_ET_ELIMINATOIRE");
  const [isCreating, setIsCreating] = useState(false);
  const [setupError, setSetupError] = useState("");
  const liveMatch = data.matches.find((match) => match.status === "live" || match.status === "halftime");
  const upcoming = data.matches.filter((match) => match.status === "scheduled").sort((first, second) => first.startsAt.localeCompare(second.startsAt)).slice(0, 2);
  const priority = data.announcements.find((announcement) => announcement.priority === "important");
  const firstGroup = data.groups[0];

  async function createFirstChampionship(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setIsCreating(true);
    setSetupError("");
    try {
      const created = await tikiScoreApi.createChampionship({ name: name.trim(), slug, edition: edition.trim(), locality: locality.trim(), description: description.trim(), format });
      setActiveChampionshipId(created.id);
      await refreshCurrentUser();
      await tikiScoreService.refresh();
      success("Brouillon créé. Configurez-le avant son activation.");
      navigate("/gestion", { replace: true });
    } catch (cause) {
      setSetupError(cause instanceof Error ? cause.message : "La création du championnat n’a pas abouti.");
    } finally {
      setIsCreating(false);
    }
  }

  if (createOnly || !data.championship.id) {
    return <div className={styles.page}>
      <PageHeader eyebrow="Configuration initiale" title="Votre championnat commence ici" description="Cette instance n’a pas encore de championnat configuré." />
      {user ? <form className={`${styles.panel} ${styles.formStack}`} onSubmit={(event) => void createFirstChampionship(event)}>
        <h2 className={styles.panelTitle}>Créer un championnat en brouillon</h2>
        <label className={styles.fieldLabel}>Nom du championnat<input className={styles.formInput} value={name} onChange={(event) => setName(event.target.value)} maxLength={150} required /></label>
        <label className={styles.fieldLabel}>Édition<input className={styles.formInput} value={edition} onChange={(event) => setEdition(event.target.value)} maxLength={100} /></label>
        <label className={styles.fieldLabel}>Localité<input className={styles.formInput} value={locality} onChange={(event) => setLocality(event.target.value)} maxLength={150} /></label>
        <label className={styles.fieldLabel}>Description<textarea className={`${styles.formInput} ${styles.formTextarea}`} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} /></label>
        <Select label="Format" options={[{ value: "LIGUE", label: "Ligue" }, { value: "GROUPES", label: "Groupes" }, { value: "ELIMINATOIRE", label: "Éliminatoire" }, { value: "GROUPES_ET_ELIMINATOIRE", label: "Groupes et éliminatoire" }]} value={format} onChange={(event) => setFormat(event.target.value)} />
        {setupError && <p className={styles.authError} role="alert">{setupError}</p>}
        <Button type="submit" isLoading={isCreating} loadingText="Création…">Créer le brouillon</Button>
      </form> : <EmptyState title="Connectez-vous pour commencer" body="Le premier compte connecté qui crée ce championnat en deviendra l’administrateur." action={<Link to="/connexion"><Button>Se connecter</Button></Link>} />}
    </div>;
  }

  async function shareChampionship() {
    const url = resolvePublicUrl(data.championship.publicUrl);
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
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const filtered = useMemo(() => data.matches.filter((match) => {
    if (filter === "upcoming") return match.status === "scheduled";
    if (filter === "results") return match.status === "finished";
    if (filter === "live") return match.status === "live" || match.status === "halftime";
    return true;
  }).filter((match) => {
    const startsAt = new Date(match.startsAt);
    const startBoundary = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const endBoundary = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
    if (startBoundary && startsAt < startBoundary) return false;
    if (endBoundary && startsAt > endBoundary) return false;
    const normalizedQuery = query.trim().toLocaleLowerCase("fr-FR");
    if (!normalizedQuery) return true;
    const home = data.teams.find((team) => team.id === match.homeTeamId)?.name ?? "";
    const away = data.teams.find((team) => team.id === match.awayTeamId)?.name ?? "";
    return [home, away, match.venue].some((value) => value.toLocaleLowerCase("fr-FR").includes(normalizedQuery));
  }).sort((first, second) => filter === "results"
    ? second.startsAt.localeCompare(first.startsAt)
    : first.startsAt.localeCompare(second.startsAt)), [data.matches, data.teams, dateFrom, dateTo, filter, query]);
  const filters = [{ id: "all", label: "Tous" }, { id: "upcoming", label: "À venir" }, { id: "results", label: "Résultats" }, { id: "live", label: "En direct" }] as const;
  const hasFilters = Boolean(query || dateFrom || dateTo || filter !== "all");

  return <div className={styles.page}>
    <PageHeader eyebrow="Compétition" title="Matchs" description="Calendrier, résultats et suivi des rencontres." />
    <section className={styles.matchesToolbar} aria-label="Filtres des matchs">
      <label className={`${styles.fieldLabel} ${styles.matchSearch}`}>Rechercher<input className={styles.formInput} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Équipe ou terrain" /></label>
      <label className={`${styles.fieldLabel} ${styles.matchDateFilter}`}>Du<input className={styles.formInput} type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} /></label>
      <label className={`${styles.fieldLabel} ${styles.matchDateFilter}`}>Au<input className={styles.formInput} type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></label>
      <div className={styles.matchSegments} role="group" aria-label="Statut des matchs">
        {filters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} className={`${styles.matchSegment} ${filter === item.id ? styles.matchSegmentActive : ""}`} onClick={() => setFilter(item.id)}>{item.label}</button>)}
      </div>
      <Button className={styles.matchReset} variant="ghost" size="small" disabled={!hasFilters} title="Réinitialiser les filtres" aria-label="Réinitialiser les filtres" onClick={() => { setQuery(""); setDateFrom(""); setDateTo(""); setFilter("all"); }}><RotateCcw size={15} aria-hidden="true" /></Button>
    </section>
    {filtered.length ? <><p className={styles.matchCount}>{filtered.length} rencontre{filtered.length === 1 ? "" : "s"}</p><div className={styles.matchGrid}>{filtered.map((match) => <MatchCard key={match.id} match={match} />)}</div></> : <EmptyState title="Aucun match dans cette sélection" body={hasFilters ? "Modifiez la recherche, la période ou le statut, ou réinitialisez les filtres." : "Les rencontres apparaîtront ici."} action={hasFilters ? <Button variant="secondary" onClick={() => { setQuery(""); setDateFrom(""); setDateTo(""); setFilter("all"); }}><RotateCcw size={15} aria-hidden="true" />Réinitialiser</Button> : undefined} />}
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
  const { permissions, user } = useDemoAccess();
  const { success, error } = useToast();
  const match = data.matches.find((candidate) => candidate.id === matchId);
  const liveMinute = useLiveMatchMinute(match);
  const [liveConnection, setLiveConnection] = useState<LiveConnectionStatus>("disconnected");
  const [ratings, setRatings] = useState<MatchRatingData | null>(null);
  const [savingRatingFor, setSavingRatingFor] = useState<string | null>(null);
  useEffect(() => {
    if (!match || (match.status !== "live" && match.status !== "halftime")) return;
    return apiLiveTransport.connect(match.id, setLiveConnection, () => {
      void tikiScoreService.refreshMatch(match.id).catch((error: unknown) => console.error("Impossible de synchroniser le match.", error));
    });
  }, [match]);
  const matchStatus = match?.status;
  useEffect(() => {
    if (!matchStatus) return;
    let active = true;
    void tikiScoreApi.getMatchRatings(matchId).then((result) => {
      if (active) setRatings(result);
    }).catch((cause: unknown) => {
      if (active) error(cause instanceof Error ? cause.message : "Impossible de charger les notes du match.");
    });
    return () => { active = false; };
  }, [error, matchId, matchStatus]);
  if (!match) return <div className={styles.page}><PageHeader title="Match introuvable" /><EmptyState title="Cette rencontre n’existe pas" body="Elle a peut-être été déplacée ou supprimée." /></div>;
  const home = data.teams.find((team) => team.id === match.homeTeamId);
  const away = data.teams.find((team) => team.id === match.awayTeamId);
  const canManage = hasPermission(permissions, "match:manage:assigned")
    && (Boolean(user && match.assignedManagerIds.includes(user.id)) || hasPermission(permissions, "competition:manage"));
  const status = match.status === "live" || match.status === "halftime" ? "Direct" : match.status === "finished" ? "Terminé" : match.status === "postponed" ? "Reporté" : match.status === "cancelled" ? "Annulé" : "À venir";

  async function ratePlayer(playerId: string, score: number) {
    setSavingRatingFor(playerId);
    try {
      setRatings(await tikiScoreApi.rateMatchPlayer(matchId, playerId, score));
      success("Note enregistrée.");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Impossible d’enregistrer cette note.");
    } finally {
      setSavingRatingFor(null);
    }
  }

  const ratedPlayers = ratings?.players.filter((player) => player.ratingCount > 0) ?? [];

  return <div className={styles.page}>
    <PageHeader eyebrow={match.groupId.replace("group-", "Poule ")} title={`${home?.name ?? "Équipe"} · ${away?.name ?? "Équipe"}`} description={`${new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(new Date(match.startsAt))} · ${match.venue}`} action={canManage ? <Link to={`/gestion/matchs/${match.id}/live`}><Button><Radio size={16} aria-hidden="true" />Ouvrir la console</Button></Link> : undefined} />
    <div className={styles.consoleScore}>
      <div className={styles.consoleTeam}><TeamMark teamId={match.homeTeamId} large /><span>{home?.name}</span></div>
      <strong className={styles.consoleScoreValue}>{match.homeScore ?? "–"}<span style={{ fontSize: 20, color: "#91a097" }}> : </span>{match.awayScore ?? "–"}</strong>
      <div className={styles.consoleTeam}><TeamMark teamId={match.awayTeamId} large /><span>{away?.name}</span></div>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center" }}><Badge variant={match.status === "live" ? "live" : "neutral"} dot={match.status === "live"}>{status}{match.status === "live" || match.minute !== undefined ? ` · ${liveMinute}′` : ""}</Badge></div>
    </div>
    {(match.status === "live" || match.status === "halftime") && <div className={styles.liveConnection} role="status"><Radio size={16} aria-hidden="true" /><span>{liveConnection === "connected" ? "Direct synchronisé avec le serveur." : liveConnection === "reconnecting" ? "Reconnexion au direct…" : "Connexion au direct arrêtée."}</span></div>}
    {ratings?.ratingsOpen && <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Notes des joueurs</h2>
      {user ? <><p className={styles.contentText}>Notez les joueurs que vous souhaitez. Vous pourrez modifier vos notes jusqu’à la fin du match.</p><div className={styles.ratingList}>{ratings.players.map((player) => <div className={styles.ratingRow} key={player.playerId}>
        <div className={styles.ratingPlayer}><strong>{player.playerName}</strong><span>{player.teamName}</span></div>
        <div className={styles.ratingStars} role="group" aria-label={`Votre note pour ${player.playerName}`}>
          {[1, 2, 3, 4, 5].map((score) => <button key={score} className={styles.ratingStar} type="button" title={`${score} sur 5`} aria-label={`${score} sur 5`} aria-pressed={player.myRating === score} disabled={savingRatingFor !== null} onClick={() => void ratePlayer(player.playerId, score)}><Star size={19} aria-hidden="true" fill={player.myRating !== null && score <= player.myRating ? "currentColor" : "none"} /></button>)}
        </div>
      </div>)}</div></> : <p className={styles.contentText}><Link to="/connexion">Connectez-vous</Link> pour noter les joueurs jusqu’à la fin du match.</p>}
    </section>}
    {ratings?.resultsVisible && <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Notes du match</h2>
      {ratedPlayers.length ? <div className={styles.ratingList}>{ratedPlayers.sort((first, second) => (second.averageRating ?? 0) - (first.averageRating ?? 0)).map((player) => <div className={styles.ratingRow} key={player.playerId}>
        <div className={styles.ratingPlayer}><strong>{player.playerName}{player.manOfTheMatch && <Badge variant="warning">Homme du match</Badge>}</strong><span>{player.teamName}</span></div>
        <div className={styles.ratingResult}><span><Star size={17} fill="currentColor" aria-hidden="true" />{player.averageRating?.toFixed(1)} / 5</span><small>{player.ratingCount} note{player.ratingCount === 1 ? "" : "s"}</small></div>
      </div>)}</div> : <EmptyState title="Aucune note reçue" body="Aucun joueur n’a été évalué pendant ce match." />}
    </section>}
    <div className={styles.detailGrid}>
      <section className={styles.section}><SectionHeading title="Chronologie" />{match.events.length ? <div className={styles.eventCompartments} aria-label={`Événements, ${home?.name ?? "équipe à domicile"} contre ${away?.name ?? "équipe visiteuse"}`}><div className={styles.eventTeamHeading}>{home?.name ?? "Domicile"}</div><div className={styles.eventTeamHeading}>{away?.name ?? "Extérieur"}</div>{[...match.events].sort((first, second) => first.minute - second.minute || first.occurredAt.localeCompare(second.occurredAt)).map((event, index) => <div className={`${styles.compartmentEvent} ${event.teamId === match.awayTeamId ? styles.awayEvent : event.teamId === match.homeTeamId ? styles.homeEvent : styles.neutralEvent}`} style={{ gridRow: index + 2 }} key={event.id}><strong>{event.minute}′</strong><span>{eventDescription(event, data)}</span></div>)}</div> : <EmptyState title="Aucun événement" body="Les événements du match apparaîtront ici." />}</section>
      <aside className={styles.panel}><h2 className={styles.panelTitle}>Informations</h2><p className={styles.contentText}>{status} · {match.venue}</p></aside>
    </div>
  </div>;
}

const playerPositionLabels: Record<PlayerPosition, string> = {
  GARDIEN: "Gardien",
  DEFENSEUR: "Défense",
  MILIEU: "Milieu",
  ATTAQUANT: "Attaque",
};

export function TeamPage() {
  const { teamId = "" } = useParams();
  const data = useTikiScoreData();
  const team = data.teams.find((candidate) => candidate.id === teamId);
  if (!team) return <div className={styles.page}><PageHeader title="Équipe introuvable" /><EmptyState title="Cette équipe n’est pas disponible" body="L’équipe a été retirée ou n’existe pas dans ce championnat." /></div>;

  const teamMatches = data.matches.filter((match) => match.homeTeamId === team.id || match.awayTeamId === team.id);
  const completedMatches = teamMatches.filter((match) => match.status === "finished");
  const record = completedMatches.reduce((summary, match) => {
    const isHome = match.homeTeamId === team.id;
    const goalsFor = isHome ? match.homeScore ?? 0 : match.awayScore ?? 0;
    const goalsAgainst = isHome ? match.awayScore ?? 0 : match.homeScore ?? 0;
    summary.goalsFor += goalsFor;
    summary.goalsAgainst += goalsAgainst;
    if (goalsFor > goalsAgainst) summary.wins++;
    else if (goalsFor < goalsAgainst) summary.losses++;
    else summary.draws++;
    return summary;
  }, { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 });
  const players = data.players.filter((player) => player.teamId === team.id);
  const playersById = new Map(players.map((player) => [player.id, player]));
  const positionCounts = players.reduce<Partial<Record<PlayerPosition, number>>>((counts, player) => {
    if (player.position) counts[player.position] = (counts[player.position] ?? 0) + 1;
    return counts;
  }, {});
  const playersWithPosition = Object.values(positionCounts).reduce<number>((total, count) => total + (count ?? 0), 0);
  const playerStats = data.leaderboard.filter((entry) => entry.teamId === team.id);
  const topScorers = playerStats.filter((entry) => entry.goals > 0).sort((first, second) => second.goals - first.goals);
  const topAssists = playerStats.filter((entry) => entry.assists > 0).sort((first, second) => second.assists - first.assists);
  const latestMatches = [...completedMatches].sort((first, second) => second.startsAt.localeCompare(first.startsAt)).slice(0, 5);
  const upcomingMatches = teamMatches.filter((match) => match.status === "scheduled").sort((first, second) => first.startsAt.localeCompare(second.startsAt)).slice(0, 5);
  const positions = ["ATTAQUANT", "MILIEU", "DEFENSEUR", "GARDIEN"] as const;

  return <div className={styles.page}>
    <PageHeader eyebrow={data.groups.find((group) => group.id === team.groupId)?.name ?? "Équipe"} title={team.name} description={team.locality} />
    <section className={styles.teamOverview}>
      <div className={styles.teamIdentity}><TeamMark teamId={team.id} large /><div><h2>{team.name}</h2><span>{team.shortName}{team.locality ? ` · ${team.locality}` : ""}</span></div></div>
      <div className={styles.teamMetrics}>
        {[{ label: "Joués", value: completedMatches.length }, { label: "Victoires", value: record.wins }, { label: "Nuls", value: record.draws }, { label: "Défaites", value: record.losses }, { label: "Buts pour", value: record.goalsFor }, { label: "Buts contre", value: record.goalsAgainst }, { label: "Différence", value: record.goalsFor - record.goalsAgainst }].map((metric) => <div className={styles.teamMetric} key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}
      </div>
    </section>
    <div className={styles.twoColumn}>
      <section className={styles.section}>
        <SectionHeading title="Meilleurs buteurs" />
        {topScorers.length ? <div className={styles.leaderboard}>{topScorers.slice(0, 5).map((entry, index) => <div className={styles.leaderRow} key={entry.playerId}><span className={styles.leaderRank}>{String(index + 1).padStart(2, "0")}</span><div className={styles.leaderInfo}><strong>{players.find((player) => player.id === entry.playerId)?.displayName ?? "Joueur"}</strong><span>{players.find((player) => player.id === entry.playerId)?.position ? playerPositionLabels[players.find((player) => player.id === entry.playerId)!.position!] : team.name}</span></div><strong className={styles.leaderScore}>{entry.goals}</strong></div>)}</div> : <EmptyState title="Aucun buteur classé" body="Les buts des rencontres terminées apparaîtront ici." />}
          {topScorers.length ? <div className={styles.leaderboard}>{topScorers.slice(0, 5).map((entry, index) => { const player = playersById.get(entry.playerId); return <div className={styles.leaderRow} key={entry.playerId}><span className={styles.leaderRank}>{String(index + 1).padStart(2, "0")}</span><div className={styles.leaderInfo}><strong>{player?.displayName ?? "Joueur"}</strong><span>{player?.position ? playerPositionLabels[player.position] : team.name}</span></div><strong className={styles.leaderScore}>{entry.goals}</strong></div>; })}</div> : <EmptyState title="Aucun buteur classé" body="Les buts des rencontres terminées apparaîtront ici." />}
        <SectionHeading title="Meilleurs passeurs" />
        {topAssists.length ? <div className={styles.leaderboard}>{topAssists.slice(0, 5).map((entry, index) => <div className={styles.leaderRow} key={entry.playerId}><span className={styles.leaderRank}>{String(index + 1).padStart(2, "0")}</span><div className={styles.leaderInfo}><strong>{players.find((player) => player.id === entry.playerId)?.displayName ?? "Joueur"}</strong><span>{team.name}</span></div><strong className={styles.leaderScore}>{entry.assists}</strong></div>)}</div> : <EmptyState title="Aucun passeur classé" body="Les passes décisives enregistrées apparaîtront ici." />}
        {topAssists.length ? <div className={styles.leaderboard}>{topAssists.slice(0, 5).map((entry, index) => <div className={styles.leaderRow} key={entry.playerId}><span className={styles.leaderRank}>{String(index + 1).padStart(2, "0")}</span><div className={styles.leaderInfo}><strong>{playersById.get(entry.playerId)?.displayName ?? "Joueur"}</strong><span>{team.name}</span></div><strong className={styles.leaderScore}>{entry.assists}</strong></div>)}</div> : <EmptyState title="Aucun passeur classé" body="Les passes décisives enregistrées apparaîtront ici." />}
      </section>
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Composition de l’effectif</h2>
        {playersWithPosition ? <div className={styles.positionBreakdown}>{positions.map((position) => {
          const count = positionCounts[position] ?? 0;
          const percentage = Math.round(count / playersWithPosition * 100);
          return <div className={styles.positionRow} key={position}><div className={styles.positionLabel}><span>{playerPositionLabels[position]}</span><strong>{count} · {percentage}%</strong></div><div className={styles.positionTrack} role="progressbar" aria-label={`${playerPositionLabels[position]} dans l’effectif`} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percentage}%` }} /></div></div>;
        })}</div> : <EmptyState title="Postes non renseignés" body="La répartition sera visible lorsque les postes des joueurs auront été renseignés." />}
        <p className={styles.dataNote}>Répartition de l’effectif par poste, pas une note de performance.</p>
      </section>
    </div>
    <section className={styles.section}>
      <SectionHeading title={`Effectif (${players.length})`} />
      {players.length ? <div className={styles.teamRoster}>{players.map((player) => <article className={styles.rosterPlayer} key={player.id}><span className={styles.rosterNumber}>{player.jerseyNumber ?? "–"}</span><strong>{player.displayName}</strong><span>{player.position ? playerPositionLabels[player.position] : "Poste non renseigné"}</span></article>)}</div> : <EmptyState title="Effectif non renseigné" body="Les joueurs de l’équipe apparaîtront ici." />}
    </section>
    {latestMatches.length > 0 && <section className={styles.section}><SectionHeading title="Derniers résultats" /><div className={styles.matchGrid}>{latestMatches.map((match) => <MatchCard key={match.id} match={match} />)}</div></section>}
    {upcomingMatches.length > 0 && <section className={styles.section}><SectionHeading title="Prochains matchs" /><div className={styles.matchGrid}>{upcomingMatches.map((match) => <MatchCard key={match.id} match={match} />)}</div></section>}
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
    <PageHeader eyebrow="Compétition" title={title} description="Classements établis à partir des rencontres terminées." />
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
    <PageHeader eyebrow="Compétition" title="Statistiques" description="Vue d’ensemble des rencontres et des résultats du championnat." />
    <nav className={styles.tabs} aria-label="Types de classement">{rankingTabs.map((tab) => <Link key={tab.to} to={tab.to} aria-current={tab.to === location.pathname ? "page" : undefined} className={`${styles.tab} ${tab.to === location.pathname ? styles.tabActive : ""}`}>{tab.label}</Link>)}</nav>
    <div className={styles.metricGrid}>
      <div className={styles.metric}><span>Matchs joués</span><strong>{stats.matchesPlayed}</strong></div>
      <div className={styles.metric}><span>Buts inscrits</span><strong>{stats.goalsScored}</strong></div>
      <div className={styles.metric}><span>Équipes</span><strong>{stats.teamsCount}</strong></div>
      <div className={styles.metric}><span>Joueurs inscrits</span><strong>{stats.playersCount}</strong></div>
    </div>
    <section className={styles.section}><SectionHeading title="Répartition des rencontres" /><div className={styles.panel}><div className={styles.standingsList}>{(["scheduled", "live", "finished", "postponed"] as MatchStatus[]).map((status) => <div className={styles.standingRow} key={status}><span style={{ textAlign: "left" }}>{status === "scheduled" ? "À venir" : status === "live" ? "En direct" : status === "finished" ? "Terminés" : "Reportés"}</span><span>{data.matches.filter((match) => match.status === status).length}</span><span /><strong>{data.matches.filter((match) => match.status === status).length}</strong></div>)}</div></div></section>
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