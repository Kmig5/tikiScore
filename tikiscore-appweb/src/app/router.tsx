import type { ReactNode } from "react";
import { Link, Route, Routes } from "react-router-dom";
import Button from "../composants/ui/Button";
import { useDemoAccess } from "./useDemoAccess";
import type { Permission } from "../domain/types";
import AppShell from "./layout/AppShell";
import { AnnouncementsPage, HomePage, MatchDetailPage, MatchesPage, StandingsPage, StatisticsPage } from "../pages/PublicPages";
import { CommunityPage, DiscussionPage } from "../pages/CommunityPages";
import { NotificationsPage, ProfilePage } from "../pages/PersonalPages";
import { AnnouncementManagementPage, LiveConsolePage, ManagerMatchesPage, ManagementHomePage, ModerationPage, ScheduleManagementPage, SettingsPage, SharingPage, TeamsManagementPage } from "../pages/ManagementPages";
import { EmptyState, PageHeader } from "../pages/shared";
import styles from "../pages/pages.module.css";

function PermissionRoute({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { permissions } = useDemoAccess();
  if (!permissions.includes(permission)) {
    return <div className={styles.page}><PageHeader eyebrow="Accès de démonstration" title="Cette vue n’est pas activée" description="Choisis un profil d’aperçu dans l’en-tête pour parcourir cet espace." /><EmptyState title="Permission d’aperçu manquante" body={`Permission requise : ${permission}. Ceci ne remplace pas le contrôle d’accès du serveur.`} /></div>;
  }
  return children;
}

function NotFoundPage() {
  return <div className={styles.page}><PageHeader eyebrow="Erreur 404" title="Cette page n’existe pas" description="Le lien demandé ne correspond à aucune page du championnat." /><EmptyState title="Revenir au championnat" body="Les pages disponibles sont accessibles depuis la navigation." action={<Link to="/"><Button>Accueil</Button></Link>} /></div>;
}

function RouteContent() {
  return <Routes>
    <Route element={<AppShell />}>
      <Route index element={<HomePage />} />
      <Route path="matchs" element={<MatchesPage />} />
      <Route path="matchs/:matchId" element={<MatchDetailPage />} />
      <Route path="classements" element={<StandingsPage />} />
      <Route path="classements/buteurs" element={<StandingsPage type="goals" />} />
      <Route path="classements/passeurs" element={<StandingsPage type="assists" />} />
      <Route path="classements/cartons" element={<StandingsPage type="cards" />} />
      <Route path="statistiques" element={<StatisticsPage />} />
      <Route path="communaute" element={<CommunityPage />} />
      <Route path="communaute/:discussionId" element={<DiscussionPage />} />
      <Route path="communiques" element={<AnnouncementsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profil" element={<ProfilePage />} />
      <Route path="gestion" element={<PermissionRoute permission="competition:manage"><ManagementHomePage /></PermissionRoute>} />
      <Route path="gestion/matchs" element={<PermissionRoute permission="match:manage:assigned"><ManagerMatchesPage /></PermissionRoute>} />
      <Route path="gestion/matchs/:id/live" element={<PermissionRoute permission="match:manage:assigned"><LiveConsolePage /></PermissionRoute>} />
      <Route path="gestion/equipes" element={<PermissionRoute permission="competition:manage"><TeamsManagementPage /></PermissionRoute>} />
      <Route path="gestion/calendrier" element={<PermissionRoute permission="competition:manage"><ScheduleManagementPage /></PermissionRoute>} />
      <Route path="gestion/annonces" element={<PermissionRoute permission="competition:manage"><AnnouncementManagementPage /></PermissionRoute>} />
      <Route path="gestion/forum" element={<PermissionRoute permission="forum:moderate"><ModerationPage /></PermissionRoute>} />
      <Route path="gestion/partage" element={<PermissionRoute permission="competition:share"><SharingPage /></PermissionRoute>} />
      <Route path="gestion/parametres" element={<PermissionRoute permission="competition:manage"><SettingsPage /></PermissionRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>;
}

export default function AppRouter() {
  return <RouteContent />;
}