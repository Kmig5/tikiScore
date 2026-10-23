import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeftRight, Download, FilePlus2, Goal, Link2, Pause, Pin, Play, Printer, QrCode, RefreshCw, RotateCcw, ShieldAlert, Square, UsersRound, Whistle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Link, useParams } from "react-router-dom";
import Badge from "../composants/ui/Badge";
import Button from "../composants/ui/Button";
import ConfirmDialog from "../composants/ui/ConfirmDialog";
import Select from "../composants/ui/Select";
import Switch from "../composants/ui/Switch";
import { useDemoAccess } from "../app/useDemoAccess";
import { useLiveMatchMinute, useTikiScoreData } from "../app/hooks";
import { hasPermission } from "../domain/permissions";
import type { MatchEventType } from "../domain/types";
import { tikiScoreService } from "../services/tikiScoreService";
import { apiLiveTransport, type LiveConnectionStatus } from "../services/liveTransport";
import { tikiScoreApi, type AdminUser } from "../services/api";
import { useToast } from "../contexts/useToast";
import { EmptyState, MatchCard, PageHeader, SectionHeading, TeamMark } from "./shared";
import styles from "./pages.module.css";

function PermissionNotice({ permission }: { permission: "competition:manage" | "match:manage:assigned" | "forum:moderate" | "competition:share" }) {
  const { user } = useDemoAccess();
  return <EmptyState title="Accès non autorisé" body={`Connectez-vous avec un compte disposant de la permission ${permission}.${user ? ` Compte courant : ${user.username}.` : ""}`} />;
}

export function ManagementHomePage() {
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  if (!hasPermission(permissions, "competition:manage")) return <div className={styles.page}><PageHeader eyebrow="Espace de gestion" title="Administration" /><PermissionNotice permission="competition:manage" /></div>;
  const entries = [
    { to: "/gestion/matchs", label: "Gestion des matchs", detail: `${data.matches.filter((match) => match.status === "scheduled" || match.status === "live").length} rencontres à suivre` },
    { to: "/gestion/equipes", label: "Équipes et joueurs", detail: `${data.teams.length} équipes · ${data.players.length} joueurs` },
    { to: "/gestion/calendrier", label: "Calendrier", detail: "Programmer une rencontre" },
    { to: "/gestion/annonces", label: "Annonces et communiqués", detail: `${data.announcements.length} publications officielles` },
    { to: "/gestion/forum", label: "Modération du forum", detail: `${data.discussions.length} discussions visibles` },
    { to: "/gestion/partage", label: "Partage public", detail: "Lien, QR code et impression" },
    { to: "/gestion/parametres", label: "Paramètres", detail: "Préférences locales du championnat" },
  ];
  return <div className={styles.page}>
    <PageHeader eyebrow="Espace de gestion" title="Administration" description="Gérez les données enregistrées sur le serveur du championnat." />
    <div className={styles.list}>{entries.map((entry) => <Link className={styles.discussion} key={entry.to} to={entry.to}><h3>{entry.label}</h3><p>{entry.detail}</p></Link>)}</div>
  </div>;
}

export function ManagerMatchesPage() {
  const data = useTikiScoreData();
  const { permissions, user } = useDemoAccess();
  const { error } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const isAdministrator = hasPermission(permissions, "competition:manage");
  const matches = data.matches.filter((match) => isAdministrator || Boolean(user && match.assignedManagerIds.includes(user.id)));
  useEffect(() => {
    if (!isAdministrator) return;
    void tikiScoreApi.getAdminUsers().then(setUsers).catch((cause: unknown) => error(cause instanceof Error ? cause.message : "Impossible de charger les utilisateurs."));
  }, [error, isAdministrator]);

  if (!hasPermission(permissions, "match:manage:assigned")) return <div className={styles.page}><PageHeader eyebrow="Gestion des matchs" title="Rencontres attribuées" /><PermissionNotice permission="match:manage:assigned" /></div>;

  async function assign(matchId: string, managerId: string) {
    try {
      await tikiScoreService.updateManagerAssignment(matchId, managerId ? [managerId] : []);
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "L’affectation n’a pas abouti.");
    }
  }

  return <div className={styles.page}>
    <PageHeader eyebrow="Espace gestionnaire" title="Rencontres attribuées" description="Les actions sont enregistrées et autorisées par le serveur." />
    {matches.length ? <div className={styles.matchGrid}>{matches.map((match) => <div key={match.id} className={styles.managerMatch}><MatchCard match={match} />{isAdministrator && <Select label="Gestionnaire attribué" options={[{ value: "", label: "Choisir un gestionnaire" }, ...users.filter((candidate) => candidate.roles.includes("MATCH_MANAGER")).map((candidate) => ({ value: candidate.id, label: candidate.displayName }))]} value="" onChange={(event) => void assign(match.id, event.target.value)} />}<Link to={`/gestion/matchs/${match.id}/live`}><Button fullWidth><Whistle size={15} aria-hidden="true" />Ouvrir la console</Button></Link></div>)}</div> : <EmptyState title="Aucun match attribué" body="Aucune rencontre n’est affectée à votre compte." />}
  </div>;
}

export function LiveConsolePage() {
  const { id = "" } = useParams();
  const data = useTikiScoreData();
  const { permissions, user } = useDemoAccess();
  const { success, error } = useToast();
  const match = data.matches.find((entry) => entry.id === id);
  const liveMinute = useLiveMatchMinute(match);
  const [teamId, setTeamId] = useState(match?.homeTeamId ?? "");
  const [playerId, setPlayerId] = useState("");
  const [relatedPlayerId, setRelatedPlayerId] = useState("");
  const [minute, setMinute] = useState(String(match?.minute ?? 0));
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [eventToUndoId, setEventToUndoId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [lastResync, setLastResync] = useState<string | null>(null);
  const [liveConnection, setLiveConnection] = useState<LiveConnectionStatus>("disconnected");
  const canManage = hasPermission(permissions, "match:manage:assigned") && Boolean(match && (match.assignedManagerIds.includes(user?.id ?? "") || hasPermission(permissions, "competition:manage")));
  const availablePlayers = useMemo(() => data.players.filter((player) => player.teamId === teamId), [data.players, teamId]);
  useEffect(() => {
    if (!match || (match.status !== "live" && match.status !== "halftime")) return;
    return apiLiveTransport.connect(match.id, setLiveConnection, () => {
      void tikiScoreService.refreshMatch(match.id).catch((cause: unknown) => error(cause instanceof Error ? cause.message : "Impossible de synchroniser la rencontre."));
    });
  }, [error, match?.id, match?.status]);

  if (!match) return <div className={styles.page}><PageHeader title="Match introuvable" /><EmptyState title="Rencontre introuvable" body="Retourne à la liste des matchs attribués." action={<Link to="/gestion/matchs"><Button variant="secondary">Retour</Button></Link>} /></div>;
  if (!canManage) return <div className={styles.page}><PageHeader eyebrow="Console terrain" title="Accès non autorisé" /><PermissionNotice permission="match:manage:assigned" /></div>;

  const home = data.teams.find((team) => team.id === match.homeTeamId);
  const away = data.teams.find((team) => team.id === match.awayTeamId);

  async function resyncEvents() {
    if (!match) return;
    setIsResyncing(true);
    try {
      await tikiScoreService.refreshMatch(match.id);
      setLastResync(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      success("Chronologie resynchronisée avec le serveur.");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "La resynchronisation a échoué.");
    } finally {
      setIsResyncing(false);
    }
  }

  async function submitEvent(type: MatchEventType) {
    if (!match || isSubmitting) return;
    setIsSubmitting(true);
    const eventMinute = match.status === "live" ? liveMinute : Math.max(0, Number(minute) || 0);
    try {
      if (type === "periodStart") await tikiScoreService.startMatch(match.id);
      else if (type === "halftime") await tikiScoreService.halfTime(match.id);
      else if (type === "periodResume") await tikiScoreService.resumeMatch(match.id);
      else if (type === "fullTime") await tikiScoreService.finishMatch(match.id);
      else await tikiScoreService.appendMatchEvent(match.id, { type, minute: eventMinute, teamId, playerId: playerId || undefined, relatedPlayerId: relatedPlayerId || undefined });
      success("Événement enregistré sur le serveur.");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "L’événement n’a pas été enregistré.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <div className={styles.page}>
    <PageHeader eyebrow="Console terrain" title="Saisie du match" description={`${home?.name} contre ${away?.name} · ${match.venue}`} action={<Badge variant={liveConnection === "connected" ? "live" : "warning"}><SignalStatus status={liveConnection} /></Badge>} />
    <div className={styles.warningBox}><ShieldAlert size={16} aria-hidden="true" /><span>{liveConnection === "connected" ? "Connexion serveur active." : "Connexion au serveur interrompue ou en cours."}{lastResync && ` Dernière synchronisation : ${lastResync}.`}</span><Button size="small" variant="secondary" disabled={isResyncing} onClick={() => void resyncEvents()}><RefreshCw size={14} aria-hidden="true" />{isResyncing ? "Relecture…" : "Resynchroniser"}</Button></div>
    <div className={styles.consoleScore}>
      <div className={styles.consoleTeam}><TeamMark teamId={match.homeTeamId} large /><span>{home?.name}</span></div>
      <strong className={styles.consoleScoreValue}>{match.homeScore ?? 0} : {match.awayScore ?? 0}</strong>
      <div className={styles.consoleTeam}><TeamMark teamId={match.awayTeamId} large /><span>{away?.name}</span></div>
      <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}><Badge variant={match.status === "live" ? "live" : "neutral"} dot={match.status === "live"}>{match.status === "finished" ? "Terminé" : match.status === "halftime" ? "Mi-temps" : match.status === "scheduled" ? "À venir" : "En cours"}</Badge><strong>{liveMinute}′</strong></div>
    </div>
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Nouvel événement</h2>
      <div className={styles.inlineForm}>
        <div className={styles.fieldLabel}><span>Équipe</span><Select label="Équipe" options={[{ value: match.homeTeamId, label: home?.name ?? "Domicile" }, { value: match.awayTeamId, label: away?.name ?? "Extérieur" }]} value={teamId} onChange={(event) => { setTeamId(event.target.value); setPlayerId(""); }} /></div>
        <div className={styles.fieldLabel}><span>Joueur</span><Select label="Joueur" options={availablePlayers.map((player) => ({ value: player.id, label: `#${player.jerseyNumber} ${player.displayName}` }))} value={playerId} onChange={(event) => setPlayerId(event.target.value)} placeholder="Aucun joueur sélectionné" /></div>
        <div className={styles.fieldLabel}><span>Passeur / sortant</span><Select label="Passeur ou joueur sortant" options={availablePlayers.filter((player) => player.id !== playerId).map((player) => ({ value: player.id, label: `#${player.jerseyNumber} ${player.displayName}` }))} value={relatedPlayerId} onChange={(event) => setRelatedPlayerId(event.target.value)} placeholder="Facultatif" /></div>
        <label className={styles.fieldLabel}>Minute<input className={styles.formInput} type="number" inputMode="numeric" min="0" max="150" value={minute} onChange={(event) => setMinute(event.target.value)} /></label>
      </div>
      <div className={styles.consoleActions}>
        <Button disabled={isSubmitting} onClick={() => submitEvent("goal")}><Goal size={17} aria-hidden="true" />Ajouter un but</Button>
        <Button variant="secondary" disabled={isSubmitting} onClick={() => submitEvent("yellowCard")}><Square size={16} aria-hidden="true" fill="currentColor" />Carton jaune</Button>
        <Button variant="danger" disabled={isSubmitting} onClick={() => submitEvent("redCard")}><Square size={16} aria-hidden="true" fill="currentColor" />Carton rouge</Button>
        <Button variant="secondary" disabled={isSubmitting} onClick={() => submitEvent("substitution")}><ArrowLeftRight size={17} aria-hidden="true" />Remplacement</Button>
        {match.status === "scheduled" && <Button variant="secondary" disabled={isSubmitting} onClick={() => submitEvent("periodStart")}><Play size={17} aria-hidden="true" />Démarrer</Button>}
        {match.status === "live" && <Button variant="secondary" disabled={isSubmitting} onClick={() => submitEvent("halftime")}><Pause size={17} aria-hidden="true" />Mi-temps</Button>}
        {match.status === "halftime" && <Button variant="secondary" disabled={isSubmitting} onClick={() => submitEvent("periodResume")}><RotateCcw size={17} aria-hidden="true" />Reprendre</Button>}
        {match.status !== "finished" && <Button variant="danger" disabled={isSubmitting} onClick={() => setIsEndDialogOpen(true)}><Whistle size={17} aria-hidden="true" />Terminer le match</Button>}
      </div>
    </section>
    <section className={styles.section}><SectionHeading title="Événements récents" /><div className={styles.eventCompartments}><div className={styles.eventTeamHeading}>{home?.name ?? "Domicile"}</div><div className={styles.eventTeamHeading}>{away?.name ?? "Extérieur"}</div>{[...match.events].reverse().slice(0, 6).map((event, index) => <div className={`${styles.compartmentEvent} ${event.teamId === match.awayTeamId ? styles.awayEvent : event.teamId === match.homeTeamId ? styles.homeEvent : styles.neutralEvent}`} style={{ gridRow: index + 2 }} key={event.id}><strong>{event.minute}′</strong><span>{event.type === "goal" ? "But" : event.type === "yellowCard" ? "Carton jaune" : event.type === "redCard" ? "Carton rouge" : event.type === "substitution" ? "Remplacement" : event.type === "fullTime" ? "Fin du match" : "Événement de jeu"}</span><Button size="small" variant="ghost" aria-label={`Annuler l’événement de la ${event.minute}e minute`} onClick={() => setEventToUndoId(event.id)}>Annuler</Button></div>)}</div></section>
    <ConfirmDialog open={isEndDialogOpen} title="Terminer le match ?" message="La rencontre passera au statut terminé sur le serveur." variant="danger" onCancel={() => setIsEndDialogOpen(false)} onConfirm={() => { setIsEndDialogOpen(false); void submitEvent("fullTime"); }} />
    <ConfirmDialog open={eventToUndoId !== null} title="Annuler cet événement ?" message="L’événement sera annulé et le serveur recalculera la chronologie." variant="danger" confirmLabel="Annuler l’événement" onCancel={() => setEventToUndoId(null)} onConfirm={() => { const eventId = eventToUndoId; setEventToUndoId(null); if (eventId) void tikiScoreService.removeMatchEvent(match.id, eventId).then(() => success("Événement annulé.")).catch((cause: unknown) => error(cause instanceof Error ? cause.message : "L’annulation a échoué.")); }} />
  </div>;
}

function SignalStatus({ status }: { status: LiveConnectionStatus }) { return <><span className={styles.statusDot} />{status === "connected" ? "EN LIGNE" : status === "reconnecting" ? "RECONNEXION" : "HORS LIGNE"}</>; }

export function TeamsManagementPage() {
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  const { success, error } = useToast();
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState(data.groups[0]?.id ?? "");
  const [playerName, setPlayerName] = useState("");
  const [playerTeamId, setPlayerTeamId] = useState(data.teams[0]?.id ?? "");
  const [playerNumber, setPlayerNumber] = useState("1");
  if (!hasPermission(permissions, "competition:manage")) return <div className={styles.page}><PageHeader title="Équipes et joueurs" /><PermissionNotice permission="competition:manage" /></div>;

  async function submitTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !groupId) return;
    try {
      await tikiScoreService.addTeam({ name: name.trim(), shortName: name.trim().replace(/\s+/g, "").slice(0, 3).toUpperCase(), locality: "À définir", primaryColor: "#0d844b", secondaryColor: "#e8f4ec", groupId });
      setName("");
      success("Équipe ajoutée.");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Impossible d’ajouter l’équipe.");
    }
  }

  async function submitPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!playerName.trim() || !playerTeamId) return;
    try {
      await tikiScoreService.addPlayer({ displayName: playerName.trim(), jerseyNumber: Math.max(1, Number(playerNumber) || 1), teamId: playerTeamId });
      setPlayerName("");
      success("Joueur ajouté.");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Impossible d’ajouter le joueur.");
    }
  }

  return <div className={styles.page}><PageHeader eyebrow="Administration" title="Équipes et joueurs" description={`${data.teams.length} équipes enregistrées.`} />
    <form className={`${styles.panel} ${styles.inlineForm}`} onSubmit={submitTeam}>
      <label className={styles.fieldLabel}>Nom de l’équipe<input className={styles.formInput} value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required /></label>
      <div className={styles.fieldLabel}><span>Poule</span><Select label="Poule" options={data.groups.map((group) => ({ value: group.id, label: group.name }))} value={groupId} onChange={(event) => setGroupId(event.target.value)} /></div>
      <Button type="submit" disabled={!name.trim()}><UsersRound size={15} aria-hidden="true" />Ajouter</Button>
    </form>
    <form className={`${styles.panel} ${styles.inlineForm}`} onSubmit={submitPlayer}>
      <label className={styles.fieldLabel}>Nom affiché<input className={styles.formInput} value={playerName} onChange={(event) => setPlayerName(event.target.value)} maxLength={80} required /></label>
      <div className={styles.fieldLabel}><span>Équipe</span><Select label="Équipe du joueur" options={data.teams.map((team) => ({ value: team.id, label: team.name }))} value={playerTeamId} onChange={(event) => setPlayerTeamId(event.target.value)} /></div>
      <label className={styles.fieldLabel}>Numéro<input className={styles.formInput} type="number" inputMode="numeric" min="1" max="99" value={playerNumber} onChange={(event) => setPlayerNumber(event.target.value)} required /></label>
      <Button type="submit" disabled={!playerName.trim()}><UsersRound size={15} aria-hidden="true" />Ajouter joueur</Button>
    </form>
    <section className={styles.section}><SectionHeading title="Équipes inscrites" /><div className={styles.metricGrid}>{data.teams.map((team) => <article className={styles.metric} key={team.id}><TeamMark teamId={team.id} /><strong style={{ fontSize: 14 }}>{team.name}</strong><span>{data.groups.find((group) => group.id === team.groupId)?.name} · {team.locality}</span><span>{data.players.filter((player) => player.teamId === team.id).length} joueur(s)</span></article>)}</div></section>
    <p className={styles.dataNote}>Les fiches joueurs détaillées et leurs autorisations photo dépendent des contrats serveur à venir.</p>
  </div>;
}

export function ScheduleManagementPage() {
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  const { success, error } = useToast();
  const [homeTeamId, setHomeTeamId] = useState(data.teams[0]?.id ?? "");
  const [awayTeamId, setAwayTeamId] = useState(data.teams[1]?.id ?? "");
  const [startsAt, setStartsAt] = useState("");
  const [venue, setVenue] = useState("Terrain municipal");
  if (!hasPermission(permissions, "competition:manage")) return <div className={styles.page}><PageHeader title="Programmation" /><PermissionNotice permission="competition:manage" /></div>;

  async function submitMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startsAt || homeTeamId === awayTeamId) return;
    const groupId = data.teams.find((team) => team.id === homeTeamId)?.groupId ?? data.groups[0]?.id ?? "";
    try {
      await tikiScoreService.addMatch({ groupId, homeTeamId, awayTeamId, startsAt: new Date(startsAt).toISOString(), venue: venue.trim() || "Terrain à définir" });
      setStartsAt("");
      success("Rencontre ajoutée au calendrier.");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Impossible de programmer le match.");
    }
  }

  return <div className={styles.page}><PageHeader eyebrow="Administration" title="Programmation" description="Créer et consulter les rencontres du calendrier du championnat." />
    <form className={`${styles.panel} ${styles.formStack}`} onSubmit={submitMatch}>
      <h2 className={styles.panelTitle}>Ajouter une rencontre</h2>
      <div className={styles.inlineForm}>
        <div className={styles.fieldLabel}><span>Équipe à domicile</span><Select label="Équipe à domicile" options={data.teams.map((team) => ({ value: team.id, label: team.name }))} value={homeTeamId} onChange={(event) => setHomeTeamId(event.target.value)} /></div>
        <div className={styles.fieldLabel}><span>Équipe visiteuse</span><Select label="Équipe visiteuse" options={data.teams.map((team) => ({ value: team.id, label: team.name }))} value={awayTeamId} onChange={(event) => setAwayTeamId(event.target.value)} /></div>
        <label className={styles.fieldLabel}>Date et heure<input className={styles.formInput} type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required /></label>
        <label className={styles.fieldLabel}>Terrain<input className={styles.formInput} value={venue} onChange={(event) => setVenue(event.target.value)} maxLength={120} required /></label>
      </div>
      <div><Button type="submit" disabled={!startsAt || homeTeamId === awayTeamId}><FilePlus2 size={15} aria-hidden="true" />Programmer</Button></div>
    </form>
    <section className={styles.section}><SectionHeading title="Calendrier" /><div className={styles.matchGrid}>{[...data.matches].sort((first, second) => first.startsAt.localeCompare(second.startsAt)).map((match) => <MatchCard key={match.id} match={match} />)}</div></section>
  </div>;
}

export function AnnouncementManagementPage() {
  const { permissions } = useDemoAccess();
  const data = useTikiScoreData();
  const { success, error } = useToast();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [important, setImportant] = useState(false);
  if (!hasPermission(permissions, "competition:manage")) return <div className={styles.page}><PageHeader title="Annonces et communiqués" /><PermissionNotice permission="competition:manage" /></div>;

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !excerpt.trim() || !body.trim()) return;
    try {
      await tikiScoreService.addAnnouncement({ title: title.trim(), excerpt: excerpt.trim(), body: body.trim(), priority: important ? "important" : "normal" });
      setTitle(""); setExcerpt(""); setBody(""); setImportant(false);
      success("Communiqué publié.");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Impossible de publier le communiqué.");
    }
  }

  return <div className={styles.page}><PageHeader eyebrow="Administration" title="Annonces et communiqués" description="Publiez les informations officielles du championnat." />
    <form className={`${styles.panel} ${styles.formStack}`} onSubmit={publish}>
      <h2 className={styles.panelTitle}>Nouvelle publication officielle</h2>
      <label className={styles.fieldLabel}>Titre<input className={styles.formInput} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={150} required /></label>
      <label className={styles.fieldLabel}>Résumé<input className={styles.formInput} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} maxLength={240} required /></label>
      <label className={styles.fieldLabel}>Contenu<textarea className={`${styles.formInput} ${styles.formTextarea}`} value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} required /></label>
      <Switch label="Mettre en avant" description="Mettre le communiqué en priorité sur l’accueil." checked={important} onChange={setImportant} />
      <div><Button type="submit" disabled={!title.trim() || !excerpt.trim() || !body.trim()}><FilePlus2 size={15} aria-hidden="true" />Publier</Button></div>
    </form>
    <section className={styles.section}><SectionHeading title="Publications existantes" /><div className={styles.list}>{data.announcements.map((announcement) => <article key={announcement.id} className={styles.announcement}><div className={styles.announcementHeader}><h3>{announcement.title}</h3><Badge variant={announcement.priority === "important" ? "warning" : "info"}>Communiqué</Badge></div><p>{announcement.excerpt}</p></article>)}</div></section>
  </div>;
}

export function ModerationPage() {
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  const { success, error } = useToast();
  if (!hasPermission(permissions, "forum:moderate")) return <div className={styles.page}><PageHeader title="Modération" /><PermissionNotice permission="forum:moderate" /></div>;
  const discussions = data.discussions;
  return <div className={styles.page}><PageHeader eyebrow="Espace modération" title="Modération du forum" description="Traitez les signalements et appliquez les décisions de modération." />
    <section className={styles.section}><SectionHeading title={`Signalements ouverts (${data.reports.filter((report) => !report.resolved).length})`} />{data.reports.some((report) => !report.resolved) ? <div className={styles.list}>{data.reports.filter((report) => !report.resolved).map((report) => {
      const reportedDiscussion = discussions.find((discussion) => discussion.id === report.discussionId);
      return <article className={styles.discussion} key={report.id}><div className={styles.discussionMeta}><Badge variant="warning">À examiner</Badge><span>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.createdAt))}</span></div><h3>{reportedDiscussion?.title ?? "Discussion supprimée"}</h3><p>{report.reason}</p><Button size="small" variant="secondary" onClick={() => { void tikiScoreService.resolveForumReport(report.id).then(() => success("Signalement traité.")).catch((cause: unknown) => error(cause instanceof Error ? cause.message : "Impossible de traiter le signalement.")); }}>Marquer comme traité</Button></article>;
    })}</div> : <EmptyState title="Aucun signalement ouvert" body="Les nouveaux signalements apparaîtront dans cette file." />}</section>
    {discussions.length ? <div className={styles.list}>{discussions.map((discussion) => <article className={styles.discussion} key={discussion.id}><div className={styles.discussionMeta}><Badge variant={discussion.hidden ? "danger" : "neutral"}>{discussion.hidden ? "Masquée" : discussion.closed ? "Fermée" : "Visible"}</Badge><span>{discussion.category} · {discussion.authorName}</span></div><h3>{discussion.title}</h3><p>{discussion.body}</p><div className={styles.discussionActions}>
      <Button size="small" variant="secondary" onClick={() => { void tikiScoreService.setDiscussionState(discussion.id, { pinned: !discussion.pinned }).then(() => success(discussion.pinned ? "Discussion désépinglée." : "Discussion épinglée.")).catch((cause: unknown) => error(cause instanceof Error ? cause.message : "La modification a échoué.")); }}><Pin size={14} aria-hidden="true" />{discussion.pinned ? "Désépingler" : "Épingler"}</Button>
      <Button size="small" variant="secondary" onClick={() => { void tikiScoreService.setDiscussionState(discussion.id, { closed: !discussion.closed }).then(() => success(discussion.closed ? "Discussion rouverte." : "Discussion fermée.")).catch((cause: unknown) => error(cause instanceof Error ? cause.message : "La modification a échoué.")); }}>{discussion.closed ? "Rouvrir" : "Fermer"}</Button>
      <Button size="small" variant="danger" onClick={() => { void tikiScoreService.setDiscussionState(discussion.id, { hidden: !discussion.hidden }).then(() => success(discussion.hidden ? "Discussion réaffichée." : "Discussion masquée.")).catch((cause: unknown) => error(cause instanceof Error ? cause.message : "La modification a échoué.")); }}>{discussion.hidden ? "Réafficher" : "Masquer"}</Button>
    </div></article>)}</div> : <EmptyState title="Aucune discussion à modérer" body="Les discussions signalées apparaîtront ici lorsque l’API de modération sera disponible." />}
  </div>;
}

export function SharingPage() {
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  const { success, error } = useToast();
  if (!hasPermission(permissions, "competition:share")) return <div className={styles.page}><PageHeader title="Partager le championnat" /><PermissionNotice permission="competition:share" /></div>;
  const configuredUrl = data.championship.publicUrl;
  const publicUrl = configuredUrl.startsWith("http") ? configuredUrl : new URL(configuredUrl, window.location.origin).toString();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      success("Lien public copié.");
    } catch {
      error("Copie indisponible dans ce navigateur.");
    }
  }

  async function shareLink() {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({ title: data.championship.name, text: `Suivez ${data.championship.name}`, url: publicUrl });
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name !== "AbortError") error("Le partage n’a pas abouti.");
    }
  }

  function downloadQr() {
    const canvas = document.getElementById("championship-qr") as HTMLCanvasElement | null;
    if (!canvas) return;
    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = "tikiscore-championnat-qr.png";
    anchor.click();
  }

  return <div className={styles.page}><PageHeader eyebrow="Administration" title="Partager le championnat" description="Le QR code contient uniquement le lien public du championnat." />
    <div className={styles.shareLayout}>
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Lien public stable</h2>
        <p className={styles.contentText}>{publicUrl}</p>
        <div className={styles.discussionActions}>
          <Button onClick={copyLink}><Link2 size={15} aria-hidden="true" />Copier le lien</Button>
          <Button variant="secondary" onClick={shareLink}><Link2 size={15} aria-hidden="true" />Partager</Button>
        </div>
      </section>
      <section className={`${styles.qrPanel} ${styles.printQr}`}>
        <h2 className={styles.panelTitle}><QrCode size={18} aria-hidden="true" />Accès au championnat</h2>
        <div className={styles.qrFrame} aria-label="QR code du lien public"><QRCodeCanvas id="championship-qr" value={publicUrl} size={240} level="H" marginSize={3} /></div>
        <p className={styles.publicUrl}>{publicUrl}</p>
        <div className={styles.discussionActions}>
          <Button size="small" variant="secondary" onClick={downloadQr}><Download size={14} aria-hidden="true" />Télécharger</Button>
          <Button size="small" variant="secondary" onClick={() => window.print()}><Printer size={14} aria-hidden="true" />Imprimer</Button>
        </div>
      </section>
    </div>
  </div>;
}

export function SettingsPage() {
  const { permissions } = useDemoAccess();
  const data = useTikiScoreData();
  const { success, error } = useToast();
  const [allowReadOnlyForum, setAllowReadOnlyForum] = useState(data.forumPublic);
  if (!hasPermission(permissions, "competition:manage")) return <div className={styles.page}><PageHeader title="Paramètres" /><PermissionNotice permission="competition:manage" /></div>;
  return <div className={styles.page}><PageHeader eyebrow="Administration" title="Paramètres du championnat" description="Réglages enregistrés par le serveur." />
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Identité</h2>
      <div className={styles.metricGrid}><div className={styles.metric}><span>Nom</span><strong style={{ fontSize: 15 }}>{data.championship.name}</strong></div><div className={styles.metric}><span>Édition</span><strong style={{ fontSize: 15 }}>{data.championship.edition}</strong></div><div className={styles.metric}><span>Localité</span><strong style={{ fontSize: 15 }}>{data.championship.locality}</strong></div><div className={styles.metric}><span>Format</span><strong style={{ fontSize: 15 }}>{data.championship.format}</strong></div></div>
    </section>
    <section className={styles.panel}><h2 className={styles.panelTitle}>Accès public</h2><Switch label="Forum visible en lecture aux visiteurs" description="La publication reste réservée aux membres connectés." checked={allowReadOnlyForum} onChange={(enabled) => { void tikiScoreService.setForumPublic(enabled).then(() => { setAllowReadOnlyForum(enabled); success("Paramètre enregistré."); }).catch((cause: unknown) => error(cause instanceof Error ? cause.message : "Impossible d’enregistrer le paramètre.")); }} /></section>
  </div>;
}