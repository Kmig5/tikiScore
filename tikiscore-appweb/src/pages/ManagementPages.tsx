import { useMemo, useState, type FormEvent } from "react";
import { Download, FilePlus2, Link2, Pin, Printer, QrCode, RefreshCw, ShieldAlert, UsersRound, Whistle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Link, useParams } from "react-router-dom";
import Badge from "../composants/ui/Badge";
import Button from "../composants/ui/Button";
import ConfirmDialog from "../composants/ui/ConfirmDialog";
import Select from "../composants/ui/Select";
import Switch from "../composants/ui/Switch";
import { useDemoAccess } from "../app/useDemoAccess";
import { useTikiScoreData } from "../app/hooks";
import { hasPermission } from "../domain/permissions";
import type { MatchEventType } from "../domain/types";
import { tikiScoreService } from "../services/tikiScoreService";
import { demoLiveTransport } from "../services/liveTransport";
import { useToast } from "../contexts/useToast";
import { EmptyState, MatchCard, PageHeader, SectionHeading, TeamMark } from "./shared";
import styles from "./pages.module.css";

function PermissionNotice({ permission }: { permission: "competition:manage" | "match:manage:assigned" | "forum:moderate" | "competition:share" }) {
  const { personaId } = useDemoAccess();
  return <EmptyState title="Accès aperçu non activé" body={`Choisis dans l’en-tête le profil de démonstration approprié. Les actions ne sont jamais sécurisées par le frontend. Permission attendue : ${permission}; profil actuel : ${personaId}.`} />;
}

export function ManagementHomePage() {
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  if (!hasPermission(permissions, "competition:manage")) return <div className={styles.page}><PageHeader eyebrow="Espace de gestion" title="Administration" /><PermissionNotice permission="competition:manage" /></div>;
  const entries = [
    { to: "/gestion/matchs", label: "Gestion des matchs", detail: `${data.matches.filter((match) => match.status === "scheduled" || match.status === "live").length} rencontres à suivre` },
    { to: "/gestion/equipes", label: "Équipes et joueurs", detail: `${data.teams.length} équipes · ${data.players.length} joueurs de démonstration` },
    { to: "/gestion/calendrier", label: "Calendrier", detail: "Programmer une rencontre" },
    { to: "/gestion/annonces", label: "Annonces et communiqués", detail: `${data.announcements.length} publications officielles démo` },
    { to: "/gestion/forum", label: "Modération du forum", detail: `${data.discussions.length} discussions visibles` },
    { to: "/gestion/partage", label: "Partage public", detail: "Lien, QR code et impression" },
    { to: "/gestion/parametres", label: "Paramètres", detail: "Préférences locales du championnat" },
  ];
  return <div className={styles.page}>
    <PageHeader eyebrow="Espace de gestion · aperçu" title="Administration" description="Les changements effectués ici restent en mémoire et ne sont pas envoyés au serveur." />
    <div className={styles.warningBox}><ShieldAlert size={16} aria-hidden="true" />Mode démonstration uniquement · aucune de ces permissions ne constitue une protection d’accès.</div>
    <div className={styles.list}>{entries.map((entry) => <Link className={styles.discussion} key={entry.to} to={entry.to}><h3>{entry.label}</h3><p>{entry.detail}</p></Link>)}</div>
  </div>;
}

export function ManagerMatchesPage() {
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  if (!hasPermission(permissions, "match:manage:assigned")) return <div className={styles.page}><PageHeader eyebrow="Gestion des matchs" title="Rencontres attribuées" /><PermissionNotice permission="match:manage:assigned" /></div>;
  const isAdministrator = hasPermission(permissions, "competition:manage");
  const matches = data.matches.filter((match) => isAdministrator || match.assignedManagerIds.includes("manager-demo"));
  return <div className={styles.page}>
    <PageHeader eyebrow="Espace gestionnaire" title="Rencontres attribuées" description="Sélectionne une rencontre pour ouvrir la console de saisie terrain." />
    <div className={styles.warningBox}><ShieldAlert size={16} aria-hidden="true" />La saisie est locale à cette démonstration; aucun score officiel ne sera publié.</div>
    {matches.length ? <div className={styles.matchGrid}>{matches.map((match) => <div key={match.id} className={styles.managerMatch}><MatchCard match={match} />{isAdministrator && <Select label="Gestionnaire attribué" options={[{ value: "", label: "Non attribué" }, { value: "manager-demo", label: "Gestionnaire de démonstration" }]} value={match.assignedManagerIds[0] ?? ""} onChange={(event) => tikiScoreService.setMatchManager(match.id, event.target.value ? [event.target.value] : [])} />}<Link to={`/gestion/matchs/${match.id}/live`}><Button fullWidth><Whistle size={15} aria-hidden="true" />Ouvrir la console</Button></Link></div>)}</div> : <EmptyState title="Aucun match attribué" body="Les rencontres assignées à ce profil apparaîtront ici." />}
  </div>;
}

export function LiveConsolePage() {
  const { id = "" } = useParams();
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  const { success } = useToast();
  const match = data.matches.find((entry) => entry.id === id);
  const [teamId, setTeamId] = useState(match?.homeTeamId ?? "");
  const [playerId, setPlayerId] = useState("");
  const [relatedPlayerId, setRelatedPlayerId] = useState("");
  const [minute, setMinute] = useState(String(match?.minute ?? 0));
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [eventToUndoId, setEventToUndoId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [lastResync, setLastResync] = useState<string | null>(null);
  const canManage = hasPermission(permissions, "match:manage:assigned") && Boolean(match && (match.assignedManagerIds.includes("manager-demo") || hasPermission(permissions, "competition:manage")));
  const availablePlayers = useMemo(() => data.players.filter((player) => player.teamId === teamId), [data.players, teamId]);

  if (!match) return <div className={styles.page}><PageHeader title="Match introuvable" /><EmptyState title="Rencontre introuvable" body="Retourne à la liste des matchs attribués." action={<Link to="/gestion/matchs"><Button variant="secondary">Retour</Button></Link>} /></div>;
  if (!canManage) return <div className={styles.page}><PageHeader eyebrow="Console terrain" title="Accès aperçu requis" /><PermissionNotice permission="match:manage:assigned" /></div>;

  const home = data.teams.find((team) => team.id === match.homeTeamId);
  const away = data.teams.find((team) => team.id === match.awayTeamId);

  async function resyncEvents() {
    if (!match) return;
    setIsResyncing(true);
    await demoLiveTransport.resync(match.id);
    setLastResync(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    setIsResyncing(false);
    success("Chronologie locale relue. Aucun flux serveur n’est connecté.");
  }

  function submitEvent(type: MatchEventType) {
    if (!match || isSubmitting) return;
    setIsSubmitting(true);
    const event = tikiScoreService.appendMatchEvent(match.id, { type, minute: Math.max(0, Number(minute) || 0), teamId: type === "periodStart" || type === "halftime" || type === "periodResume" || type === "fullTime" ? undefined : teamId, playerId: playerId || undefined, relatedPlayerId: relatedPlayerId || undefined });
    setIsSubmitting(false);
    if (event) success("Événement ajouté à la chronologie de démonstration.");
  }

  return <div className={styles.page}>
    <PageHeader eyebrow="Console terrain · mode démo" title="Saisie du match" description={`${home?.name} contre ${away?.name} · ${match.venue}`} action={<Badge variant="warning"><SignalStatus /></Badge>} />
    <div className={styles.warningBox}><ShieldAlert size={16} aria-hidden="true" /><span>Flux hors ligne · saisies en mémoire uniquement, non transmises au serveur.{lastResync && ` Dernière relecture : ${lastResync}.`}</span><Button size="small" variant="secondary" disabled={isResyncing} onClick={resyncEvents}><RefreshCw size={14} aria-hidden="true" />{isResyncing ? "Relecture…" : "Resynchroniser"}</Button></div>
    <div className={styles.consoleScore}>
      <div className={styles.consoleTeam}><TeamMark teamId={match.homeTeamId} large /><span>{home?.name}</span></div>
      <strong className={styles.consoleScoreValue}>{match.homeScore ?? 0} : {match.awayScore ?? 0}</strong>
      <div className={styles.consoleTeam}><TeamMark teamId={match.awayTeamId} large /><span>{away?.name}</span></div>
      <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}><Badge variant={match.status === "live" ? "live" : "neutral"} dot={match.status === "live"}>{match.status === "finished" ? "Terminé" : match.status === "halftime" ? "Mi-temps" : match.status === "scheduled" ? "À venir" : "En cours"}</Badge><strong>{match.minute ?? 0}′</strong></div>
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
        <Button disabled={isSubmitting} onClick={() => submitEvent("goal")}>+ Ajouter un but</Button>
        <Button variant="secondary" disabled={isSubmitting} onClick={() => submitEvent("yellowCard")}>Carton jaune</Button>
        <Button variant="danger" disabled={isSubmitting} onClick={() => submitEvent("redCard")}>Carton rouge</Button>
        <Button variant="secondary" disabled={isSubmitting} onClick={() => submitEvent("substitution")}>Remplacement</Button>
        {match.status === "scheduled" && <Button variant="secondary" disabled={isSubmitting} onClick={() => submitEvent("periodStart")}>Démarrer</Button>}
        {match.status === "live" && <Button variant="secondary" disabled={isSubmitting} onClick={() => submitEvent("halftime")}>Mi-temps</Button>}
        {match.status === "halftime" && <Button variant="secondary" disabled={isSubmitting} onClick={() => submitEvent("periodResume")}>Reprendre</Button>}
        {match.status !== "finished" && <Button variant="danger" disabled={isSubmitting} onClick={() => setIsEndDialogOpen(true)}>Terminer le match</Button>}
      </div>
    </section>
    <section className={styles.section}><SectionHeading title="Événements récents" /><div className={styles.timeline}>{[...match.events].reverse().slice(0, 6).map((event) => <div className={styles.timelineItem} key={event.id}><span className={styles.timelineMinute}>{event.minute}′</span><span className={styles.timelineDot} aria-hidden="true" /><span>{event.type === "goal" ? "But" : event.type === "yellowCard" ? "Carton jaune" : event.type === "redCard" ? "Carton rouge" : event.type === "substitution" ? "Remplacement" : event.type === "fullTime" ? "Fin du match" : "Événement de jeu"}</span><Button size="small" variant="ghost" aria-label={`Annuler l’événement de la ${event.minute}e minute`} onClick={() => setEventToUndoId(event.id)}>Annuler</Button></div>)}</div></section>
    <ConfirmDialog open={isEndDialogOpen} title="Terminer le match ?" message="La rencontre passera au statut terminé dans la démonstration." variant="danger" onCancel={() => setIsEndDialogOpen(false)} onConfirm={() => { setIsEndDialogOpen(false); submitEvent("fullTime"); }} />
    <ConfirmDialog open={eventToUndoId !== null} title="Annuler cet événement ?" message="L’événement sera retiré de cette chronologie de démonstration. Cette action ne peut pas être rétablie après réinitialisation." variant="danger" confirmLabel="Annuler l’événement" onCancel={() => setEventToUndoId(null)} onConfirm={() => { if (eventToUndoId && tikiScoreService.removeMatchEvent(match.id, eventToUndoId)) success("Événement retiré de la démonstration."); setEventToUndoId(null); }} />
  </div>;
}

function SignalStatus() { return <><span className={styles.statusDot} />DÉMO · HORS LIGNE</>; }

export function TeamsManagementPage() {
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  const { success } = useToast();
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState(data.groups[0]?.id ?? "");
  const [playerName, setPlayerName] = useState("");
  const [playerTeamId, setPlayerTeamId] = useState(data.teams[0]?.id ?? "");
  const [playerNumber, setPlayerNumber] = useState("1");
  if (!hasPermission(permissions, "competition:manage")) return <div className={styles.page}><PageHeader title="Équipes et joueurs" /><PermissionNotice permission="competition:manage" /></div>;

  function submitTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !groupId) return;
    tikiScoreService.addTeam({ name: name.trim(), shortName: name.trim().replace(/\s+/g, "").slice(0, 3).toUpperCase(), locality: "À définir", primaryColor: "#0d844b", secondaryColor: "#e8f4ec", groupId });
    setName("");
    success("Équipe ajoutée à la démonstration.");
  }

  function submitPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!playerName.trim() || !playerTeamId) return;
    tikiScoreService.addPlayer({ displayName: playerName.trim(), jerseyNumber: Math.max(1, Number(playerNumber) || 1), teamId: playerTeamId });
    setPlayerName("");
    success("Joueur ajouté à la démonstration.");
  }

  return <div className={styles.page}><PageHeader eyebrow="Administration" title="Équipes et joueurs" description={`${data.teams.length} équipes dans les données de démonstration.`} />
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
    <section className={styles.section}><SectionHeading title="Équipes inscrites" /><div className={styles.metricGrid}>{data.teams.map((team) => <article className={styles.metric} key={team.id}><TeamMark teamId={team.id} /><strong style={{ fontSize: 14 }}>{team.name}</strong><span>{data.groups.find((group) => group.id === team.groupId)?.name} · {team.locality}</span><span>{data.players.filter((player) => player.teamId === team.id).length} joueur(s) en aperçu</span></article>)}</div></section>
    <p className={styles.dataNote}>Les fiches joueurs détaillées et leurs autorisations photo dépendent des contrats serveur à venir.</p>
  </div>;
}

export function ScheduleManagementPage() {
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  const { success } = useToast();
  const [homeTeamId, setHomeTeamId] = useState(data.teams[0]?.id ?? "");
  const [awayTeamId, setAwayTeamId] = useState(data.teams[1]?.id ?? "");
  const [startsAt, setStartsAt] = useState("");
  const [venue, setVenue] = useState("Terrain municipal");
  if (!hasPermission(permissions, "competition:manage")) return <div className={styles.page}><PageHeader title="Programmation" /><PermissionNotice permission="competition:manage" /></div>;

  function submitMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startsAt || homeTeamId === awayTeamId) return;
    const groupId = data.teams.find((team) => team.id === homeTeamId)?.groupId ?? data.groups[0]?.id ?? "";
    tikiScoreService.addMatch({ groupId, homeTeamId, awayTeamId, startsAt: new Date(startsAt).toISOString(), venue: venue.trim() || "Terrain à définir" });
    setStartsAt("");
    success("Rencontre ajoutée au calendrier de démonstration.");
  }

  return <div className={styles.page}><PageHeader eyebrow="Administration" title="Programmation" description="Créer et consulter les rencontres du calendrier de démonstration." />
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
  const { success } = useToast();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [important, setImportant] = useState(false);
  if (!hasPermission(permissions, "competition:manage")) return <div className={styles.page}><PageHeader title="Annonces et communiqués" /><PermissionNotice permission="competition:manage" /></div>;

  function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !excerpt.trim() || !body.trim()) return;
    tikiScoreService.addAnnouncement({ title: title.trim(), excerpt: excerpt.trim(), body: body.trim(), priority: important ? "important" : "normal" });
    setTitle(""); setExcerpt(""); setBody(""); setImportant(false);
    success("Communiqué ajouté à cette démonstration.");
  }

  return <div className={styles.page}><PageHeader eyebrow="Administration" title="Annonces et communiqués" description="Les publications de cette page sont affichées comme officielles uniquement dans les données de démonstration." />
    <form className={`${styles.panel} ${styles.formStack}`} onSubmit={publish}>
      <h2 className={styles.panelTitle}>Nouvelle publication officielle · aperçu</h2>
      <label className={styles.fieldLabel}>Titre<input className={styles.formInput} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={150} required /></label>
      <label className={styles.fieldLabel}>Résumé<input className={styles.formInput} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} maxLength={240} required /></label>
      <label className={styles.fieldLabel}>Contenu<textarea className={`${styles.formInput} ${styles.formTextarea}`} value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} required /></label>
      <Switch label="Mettre en avant" description="Faire apparaître sur l’accueil de démonstration." checked={important} onChange={setImportant} />
      <div><Button type="submit" disabled={!title.trim() || !excerpt.trim() || !body.trim()}><FilePlus2 size={15} aria-hidden="true" />Publier en démo</Button></div>
    </form>
    <section className={styles.section}><SectionHeading title="Publications existantes" /><div className={styles.list}>{data.announcements.map((announcement) => <article key={announcement.id} className={styles.announcement}><div className={styles.announcementHeader}><h3>{announcement.title}</h3><Badge variant={announcement.priority === "important" ? "warning" : "info"}>Communiqué</Badge></div><p>{announcement.excerpt}</p></article>)}</div></section>
  </div>;
}

export function ModerationPage() {
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  const { success } = useToast();
  if (!hasPermission(permissions, "forum:moderate")) return <div className={styles.page}><PageHeader title="Modération" /><PermissionNotice permission="forum:moderate" /></div>;
  const discussions = data.discussions;
  return <div className={styles.page}><PageHeader eyebrow="Espace modération" title="Modération du forum" description="Masquer, épingler ou fermer des discussions dans cet aperçu local." />
    <div className={styles.warningBox}><ShieldAlert size={16} aria-hidden="true" />Les décisions de modération ne sont pas enregistrées côté serveur et ne sont pas visibles par les autres utilisateurs.</div>
    <section className={styles.section}><SectionHeading title={`Signalements ouverts (${data.reports.filter((report) => !report.resolved).length})`} />{data.reports.some((report) => !report.resolved) ? <div className={styles.list}>{data.reports.filter((report) => !report.resolved).map((report) => {
      const reportedDiscussion = discussions.find((discussion) => discussion.id === report.discussionId);
      return <article className={styles.discussion} key={report.id}><div className={styles.discussionMeta}><Badge variant="warning">À examiner</Badge><span>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.createdAt))}</span></div><h3>{reportedDiscussion?.title ?? "Discussion supprimée"}</h3><p>{report.reason}</p><Button size="small" variant="secondary" onClick={() => { tikiScoreService.resolveForumReport(report.id); success("Signalement traité dans la démonstration."); }}>Marquer comme traité</Button></article>;
    })}</div> : <EmptyState title="Aucun signalement ouvert" body="Les signalements des membres apparaîtront dans cette file de démonstration." />}</section>
    {discussions.length ? <div className={styles.list}>{discussions.map((discussion) => <article className={styles.discussion} key={discussion.id}><div className={styles.discussionMeta}><Badge variant={discussion.hidden ? "danger" : "neutral"}>{discussion.hidden ? "Masquée" : discussion.closed ? "Fermée" : "Visible"}</Badge><span>{discussion.category} · {discussion.authorName}</span></div><h3>{discussion.title}</h3><p>{discussion.body}</p><div className={styles.discussionActions}>
      <Button size="small" variant="secondary" onClick={() => { tikiScoreService.setDiscussionState(discussion.id, { pinned: !discussion.pinned }); success(discussion.pinned ? "Discussion désépinglée en démo." : "Discussion épinglée en démo."); }}><Pin size={14} aria-hidden="true" />{discussion.pinned ? "Désépingler" : "Épingler"}</Button>
      <Button size="small" variant="secondary" onClick={() => { tikiScoreService.setDiscussionState(discussion.id, { closed: !discussion.closed }); success(discussion.closed ? "Discussion rouverte en démo." : "Discussion fermée en démo."); }}>{discussion.closed ? "Rouvrir" : "Fermer"}</Button>
      <Button size="small" variant="danger" onClick={() => { tikiScoreService.setDiscussionState(discussion.id, { hidden: !discussion.hidden }); success(discussion.hidden ? "Discussion réaffichée en démo." : "Discussion masquée en démo."); }}>{discussion.hidden ? "Réafficher" : "Masquer"}</Button>
    </div></article>)}</div> : <EmptyState title="Aucune discussion à modérer" body="Les discussions signalées apparaîtront ici lorsque l’API de modération sera disponible." />}
  </div>;
}

export function SharingPage() {
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  const { success, error } = useToast();
  if (!hasPermission(permissions, "competition:share")) return <div className={styles.page}><PageHeader title="Partager le championnat" /><PermissionNotice permission="competition:share" /></div>;
  const publicUrl = `${window.location.origin}/`;

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

  return <div className={styles.page}><PageHeader eyebrow="Administration" title="Partager le championnat" description="Le QR code contient uniquement le lien public de démonstration." />
    <div className={styles.warningBox}><ShieldAlert size={16} aria-hidden="true" />URL de démonstration · remplacez-la par le domaine public réel lors de la mise en production. Aucun secret ni donnée personnelle n’est inclus.</div>
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
  const { success } = useToast();
  const [allowReadOnlyForum, setAllowReadOnlyForum] = useState(data.forumPublic);
  if (!hasPermission(permissions, "competition:manage")) return <div className={styles.page}><PageHeader title="Paramètres" /><PermissionNotice permission="competition:manage" /></div>;
  return <div className={styles.page}><PageHeader eyebrow="Administration" title="Paramètres du championnat" description="Réglages d’aperçu uniquement; ils ne sont pas enregistrés après rechargement." />
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Identité</h2>
      <div className={styles.metricGrid}><div className={styles.metric}><span>Nom</span><strong style={{ fontSize: 15 }}>{data.championship.name}</strong></div><div className={styles.metric}><span>Édition</span><strong style={{ fontSize: 15 }}>{data.championship.edition}</strong></div><div className={styles.metric}><span>Localité</span><strong style={{ fontSize: 15 }}>{data.championship.locality}</strong></div><div className={styles.metric}><span>Format</span><strong style={{ fontSize: 15 }}>{data.championship.format}</strong></div></div>
    </section>
    <section className={styles.panel}><h2 className={styles.panelTitle}>Accès public</h2><Switch label="Forum visible aux visiteurs" description="Contrôle d’interface uniquement dans la démo." checked={allowReadOnlyForum} onChange={(enabled) => { setAllowReadOnlyForum(enabled); tikiScoreService.setForumPublic(enabled); }} /></section>
    <section className={styles.panel}><h2 className={styles.panelTitle}>Démonstration</h2><p className={styles.contentText}>Réinitialiser restaure les données de démonstration de cette session.</p><Button variant="danger" onClick={() => { tikiScoreService.resetDemo(); success("Données de démonstration réinitialisées."); }}>Réinitialiser l’aperçu</Button></section>
  </div>;
}