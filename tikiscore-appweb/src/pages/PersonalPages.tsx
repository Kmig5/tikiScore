import { useEffect, useState, type FormEvent } from "react";
import { CheckCheck, UserRound } from "lucide-react";
import Badge from "../composants/ui/Badge";
import Button from "../composants/ui/Button";
import Checkbox from "../composants/ui/Checkbox";
import ThemeToggle from "../composants/ui/ThemeToggle";
import { useDemoAccess } from "../app/useDemoAccess";
import { useTikiScoreData } from "../app/hooks";
import { hasPermission } from "../domain/permissions";
import { tikiScoreService } from "../services/tikiScoreService";
import { ApiError } from "../services/api";
import { tikiScoreApi } from "../services/api";
import { useToast } from "../contexts/useToast";
import { Navigate, useNavigate, Link } from "react-router-dom";
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
  const { error } = useToast();
  const canManage = hasPermission(permissions, "notifications:manage");
  const unread = data.notifications.filter((notification) => !notification.read).length;

  return <div className={styles.page}>
    <PageHeader eyebrow="Votre espace" title="Notifications" description={`${unread} notification${unread === 1 ? "" : "s"} non lue${unread === 1 ? "" : "s"}.`} action={canManage && unread > 0 ? <Button variant="secondary" onClick={() => { void tikiScoreService.markAllNotificationsRead().catch((cause: unknown) => error(cause instanceof Error ? cause.message : "Impossible de mettre les notifications à jour.")); }}><CheckCheck size={15} aria-hidden="true" />Tout marquer comme lu</Button> : undefined} />
    {data.notifications.length ? <div className={styles.list}>{data.notifications.map((notification) => <article className={`${styles.announcement} ${notification.read ? "" : styles.unreadNotification}`} key={notification.id}>
      <div className={styles.announcementHeader}><h3>{notification.title}</h3><Badge variant={notification.read ? "neutral" : "info"}>{notification.read ? "Lue" : "Non lue"}</Badge></div>
      <p>{notification.message}</p><span className={styles.announcementMeta}>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.createdAt))}</span>
      {!notification.read && canManage && <Button size="small" variant="ghost" onClick={() => { void tikiScoreService.markNotificationRead(notification.id).catch((cause: unknown) => error(cause instanceof Error ? cause.message : "Impossible de mettre la notification à jour.")); }}>Marquer comme lue</Button>}
    </article>)}</div> : <EmptyState title="Aucune notification" body="Les informations importantes du championnat apparaîtront ici." />}
    {!canManage && <div className={styles.warningBox}>La consultation et la gestion des notifications nécessitent un compte membre de ce championnat.</div>}
  </div>;
}

function AccountSettingsSections() {
  const { user, permissions, refreshCurrentUser } = useDemoAccess();
  const { error, success } = useToast();
  const canManage = hasPermission(permissions, "profile:update");
  const canManageNotifications = hasPermission(permissions, "notifications:manage");
  const [profileName, setProfileName] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({ matchReminder: true, matchStart: true, liveGoals: false, scheduleChanges: true, officialNews: true, forumReplies: false });
  useEffect(() => {
    if (!canManageNotifications) return;
    void tikiScoreApi.getNotificationPreferences().then((saved) => setPreferences({
      matchReminder: saved.matchReminders,
      matchStart: saved.matchStartEnd,
      liveGoals: saved.goals,
      scheduleChanges: saved.scheduleChanges,
      officialNews: saved.announcements,
      forumReplies: saved.forumReplies,
    })).catch((cause: unknown) => error(cause instanceof Error ? cause.message : "Impossible de charger les préférences."));
  }, [canManageNotifications, error]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = (profileName ?? user?.displayName ?? "").trim();
    if (!displayName) return;
    setIsSavingProfile(true);
    try {
      await tikiScoreApi.updateProfile({ displayName });
      await refreshCurrentUser();
      setProfileName(null);
      success("Profil mis à jour.");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Impossible d’enregistrer le profil.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function updatePreference(key: keyof typeof preferences, value: boolean) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    try {
      await tikiScoreApi.updateNotificationPreferences({
        matchReminders: next.matchReminder,
        matchStartEnd: next.matchStart,
        goals: next.liveGoals,
        scheduleChanges: next.scheduleChanges,
        announcements: next.officialNews,
        forumReplies: next.forumReplies,
      });
      success("Préférence enregistrée.");
    } catch (cause) {
      setPreferences(preferences);
      error(cause instanceof Error ? cause.message : "Impossible d’enregistrer la préférence.");
    }
  }

  return <>
    <form className={`${styles.panel} ${styles.formStack}`} onSubmit={(event) => void saveProfile(event)}>
      <h2 className={styles.panelTitle}>Compte</h2>
      <div className={styles.profileRow}><span className={styles.avatar}><UserRound size={22} aria-hidden="true" /></span><div><strong>{user?.displayName ?? "Visiteur"}</strong><p>{user ? `Compte @${user.username}` : "Aucune session authentifiée"}</p></div></div>
      <label className={styles.fieldLabel}>Nom affiché<input className={styles.formInput} value={profileName ?? user?.displayName ?? ""} onChange={(event) => setProfileName(event.target.value)} maxLength={100} disabled={!user || !canManage} /></label>
      {user && canManage && <Button type="submit" isLoading={isSavingProfile} loadingText="Enregistrement…" disabled={!(profileName ?? user.displayName).trim() || (profileName ?? user.displayName).trim() === user.displayName}>Enregistrer le profil</Button>}
      {!user && <div className={styles.warningBox}>Connectez-vous pour modifier votre profil et vos préférences personnelles.</div>}
    </form>
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Préférences de notification</h2>
      {canManageNotifications ? <div className={styles.formStack}>{notificationSettings.map((setting) => <Checkbox key={setting.id} label={setting.label} description={setting.description} checked={preferences[setting.id] ?? false} onChange={(event) => void updatePreference(setting.id, event.currentTarget.checked)} />)}</div> : <div className={styles.warningBox}>Connectez-vous avec un compte autorisé pour modifier les préférences de notification.</div>}
    </section>
    <p className={styles.dataNote}>Les préférences de notification sont enregistrées dans votre compte.</p>
  </>;
}

export function AuthenticationPage({ register = false }: { register?: boolean }) {
  const { signIn, register: createAccount } = useDemoAccess();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      if (register) await createAccount(username.trim(), displayName.trim(), password);
      else await signIn(username.trim(), password);
      navigate("/parametres", { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Le serveur est indisponible. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className={styles.page}>
    <PageHeader eyebrow="Compte membre" title={register ? "Créer un compte" : "Connexion"} description="La connexion permet de participer au forum et d’accéder aux fonctions autorisées par votre compte." />
    <form className={`${styles.panel} ${styles.formStack}`} onSubmit={submit}>
      {register && <label className={styles.fieldLabel}>Nom affiché<input className={styles.formInput} value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={100} autoComplete="name" required /></label>}
      <label className={styles.fieldLabel}>Nom d’utilisateur<input className={styles.formInput} value={username} onChange={(event) => setUsername(event.target.value)} minLength={register ? 3 : undefined} maxLength={60} autoComplete="username" required /></label>
      <label className={styles.fieldLabel}>Mot de passe<input className={styles.formInput} type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={register ? 12 : undefined} maxLength={72} autoComplete={register ? "new-password" : "current-password"} required /></label>
      {register && <p className={styles.dataNote}>Utilisez au moins 12 caractères. Aucun e-mail ni téléphone n’est demandé.</p>}
      {errorMessage && <p className={styles.authError} role="alert">{errorMessage}</p>}
      <Button type="submit" disabled={submitting}>{submitting ? "Connexion…" : register ? "Créer mon compte" : "Se connecter"}</Button>
    </form>
    <p className={styles.contentText}>{register ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"} <Link to={register ? "/connexion" : "/inscription"}>{register ? "Se connecter" : "Créer un compte"}</Link></p>
  </div>;
}

export function PreferencesPage() {
  return <div className={styles.page}>
    <PageHeader eyebrow="Votre espace" title="Paramètres" description="Compte, notifications et préférences d’affichage." />
    <AccountSettingsSections />
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Apparence</h2>
      <div className={styles.discussionActions}><span className={styles.contentText}>Thème clair, sombre ou système</span><ThemeToggle /></div>
    </section>
  </div>;
}

export function ProfilePage() {
  return <Navigate to="/parametres" replace />;
}