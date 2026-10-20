import { useState } from "react";
import { BellCheck, CheckCheck, UserRound } from "lucide-react";
import Badge from "../composants/ui/Badge";
import Button from "../composants/ui/Button";
import Checkbox from "../composants/ui/Checkbox";
import Select from "../composants/ui/Select";
import { useDemoAccess } from "../app/useDemoAccess";
import { useTikiScoreData } from "../app/hooks";
import { hasPermission } from "../domain/permissions";
import { tikiScoreService } from "../services/tikiScoreService";
import { EmptyState, PageHeader } from "./shared";
import styles from "./pages.module.css";

const notificationSettings = [
  { id: "matchReminder", label: "Rappel avant un match suivi", description: "Un rappel avant le coup d’envoi." },
  { id: "matchStart", label: "Début et fin d’un match suivi", description: "Mises à jour lors des moments importants." },
  { id: "liveGoals", label: "Buts en direct", description: "Fréquence élevée · désactivé par défaut." },
  { id: "scheduleChanges", label: "Changements de programme", description: "Horaire modifié, report ou annulation." },
  { id: "officialNews", label: "Communiqués officiels", description: "Informations publiées par l’organisation." },
  { id: "forumReplies", label: "Réponses suivies", description: "Réponses dans les discussions que vous suivez." },
] as const;

export function NotificationsPage() {
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  const canManage = hasPermission(permissions, "notifications:manage");
  const unread = data.notifications.filter((notification) => !notification.read).length;

  return <div className={styles.page}>
    <PageHeader eyebrow="Votre espace" title="Notifications" description={`${unread} notification${unread === 1 ? "" : "s"} non lue${unread === 1 ? "" : "s"}.`} action={canManage && unread > 0 ? <Button variant="secondary" onClick={() => tikiScoreService.markAllNotificationsRead()}><CheckCheck size={15} aria-hidden="true" />Tout marquer comme lu</Button> : undefined} />
    {data.notifications.length ? <div className={styles.list}>{data.notifications.map((notification) => <article className={`${styles.announcement} ${notification.read ? "" : styles.unreadNotification}`} key={notification.id}>
      <div className={styles.announcementHeader}><h3>{notification.title}</h3><Badge variant={notification.read ? "neutral" : "info"}>{notification.read ? "Lue" : "Non lue"}</Badge></div>
      <p>{notification.message}</p><span className={styles.announcementMeta}>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.createdAt))}</span>
      {!notification.read && canManage && <Button size="small" variant="ghost" onClick={() => tikiScoreService.markNotificationRead(notification.id)}>Marquer comme lue</Button>}
    </article>)}</div> : <EmptyState title="Aucune notification" body="Les informations importantes du championnat apparaîtront ici." />}
    {!canManage && <div className={styles.warningBox}><BellCheck size={16} aria-hidden="true" />Les préférences de notification sont visibles dans le profil aperçu membre. Aucune notification réelle n’est envoyée.</div>}
  </div>;
}

export function ProfilePage() {
  const data = useTikiScoreData();
  const { personaId, permissions } = useDemoAccess();
  const canManage = hasPermission(permissions, "profile:update");
  const [teamId, setTeamId] = useState(data.teams[0]?.id ?? "");
  const [preferences, setPreferences] = useState<Record<string, boolean>>({ matchReminder: true, matchStart: true, liveGoals: false, scheduleChanges: true, officialNews: true, forumReplies: false });
  const persona = data.demoPersonas.find((entry) => entry.id === personaId);

  return <div className={styles.page}>
    <PageHeader eyebrow="Votre espace" title="Profil et préférences" description="Aucune donnée personnelle n’est demandée dans cet aperçu." />
    <section className={styles.panel}>
      <div className={styles.profileRow}><span className={styles.avatar}><UserRound size={22} aria-hidden="true" /></span><div><strong>{persona?.label ?? "Visiteur"}</strong><p>Profil de démonstration · aucune session authentifiée</p></div></div>
      <p className={styles.dataNote}>Les permissions visibles sont uniquement destinées à parcourir l’interface. Elles ne protègent aucune action côté serveur.</p>
    </section>
    <section className={styles.section}>
      <h2 className={styles.panelTitle}>Équipe suivie</h2>
      {canManage ? <div className={styles.panel}><Select label="Équipe favorite" options={data.teams.map((team) => ({ value: team.id, label: team.name }))} value={teamId} onChange={(event) => setTeamId(event.target.value)} helperText="Préférence non sauvegardée après rechargement." /></div> : <div className={styles.warningBox}>Sélectionnez le profil membre aperçu pour modifier cette préférence.</div>}
    </section>
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Préférences de notification</h2>
      {canManage ? <div className={styles.formStack}>{notificationSettings.map((setting) => <Checkbox key={setting.id} label={setting.label} description={setting.description} checked={preferences[setting.id] ?? false} onChange={(event) => setPreferences((current) => ({ ...current, [setting.id]: event.currentTarget.checked }))} />)}</div> : <div className={styles.warningBox}>Les préférences sont modifiables avec le profil membre aperçu.</div>}
    </section>
    <p className={styles.dataNote}>Les préférences sont conservées uniquement en mémoire pendant cette session de démonstration.</p>
  </div>;
}