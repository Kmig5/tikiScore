import type { ReactNode } from "react";
import { Link, Outlet, Route, Routes } from "react-router-dom";
import Button from "../composants/ui/Button";
import { useDemoAccess } from "./useDemoAccess";
import type { Permission } from "../domain/types";
import AppShell from "./layout/AppShell";
import { AnnouncementsPage, HomePage, MatchDetailPage, MatchesPage, StandingsPage, StatisticsPage, TeamPage } from "../pages/PublicPages";
import { CommunityPage, DiscussionPage } from "../pages/CommunityPages";
import { AuthenticationPage, NotificationsPage, PreferencesPage, ProfilePage } from "../pages/PersonalPages";
import { AnnouncementManagementPage, LiveConsolePage, ManagerMatchesPage, ManagementHomePage, ModerationPage, RolesManagementPage, ScheduleManagementPage, SettingsPage, SharingPage, SystemAdminPage, TeamsManagementPage } from "../pages/ManagementPages";
import { EmptyState, PageHeader } from "../pages/shared";
import styles from "../pages/pages.module.css";
import { getActiveChampionshipId } from "../services/api";

function PermissionRoute({ permission, children, draftAllowed = false }: { permission: Permission; children: ReactNode; draftAllowed?: boolean }) {
  const { permissions, user } = useDemoAccess();
  const activeChampionship = user?.championships.find((championship) => championship.id === getActiveChampionshipId());
  if (activeChampionship?.status === "BROUILLON" && !draftAllowed) {
    return <div className={styles.page}><PageHeader eyebrow="Configuration initiale" title="Activation requise" description="Les outils de gestion globale seront disponibles après l’activation du championnat." /><EmptyState title="Terminez la préparation" body="Configurez les rôles, les poules, les équipes et le calendrier avant de rendre le championnat public." action={<Link to="/gestion"><Button>Revenir à la préparation</Button></Link>} /></div>;
  }
  if (!permissions.includes(permission)) {
     return <div className={styles.page}><PageHeader eyebrow="Accès restreint" title="Cette page n’est pas accessible" description="Votre compte ne dispose pas des autorisations nécessaires pour cette page." /><EmptyState title="Autorisation requise" body={`Cette action nécessite la permission ${permission}.`} /></div>;
  }
  return children;
}

function PublicCompetitionRoute() {
  const { user } = useDemoAccess();
  const activeChampionship = user?.championships.find((championship) => championship.id === getActiveChampionshipId());
  if (activeChampionship?.status === "BROUILLON") {
    return <div className={styles.page}><PageHeader eyebrow="Configuration initiale" title="Championnat en préparation" /><EmptyState title="Aucune donnée publique pour le moment" body="Ce championnat restera privé jusqu’à son activation." action={<Link to="/gestion"><Button>Continuer la préparation</Button></Link>} /></div>;
  }
  return <Outlet />;
}

function NotFoundPage() {
  return <div className={styles.page}><PageHeader eyebrow="Erreur 404" title="Cette page n’existe pas" description="Le lien demandé ne correspond à aucune page du championnat." /><EmptyState title="Revenir au championnat" body="Les pages disponibles sont accessibles depuis la navigation." action={<Link to="/"><Button>Accueil</Button></Link>} /></div>;
}

function RouteContent() {
  return <Routes>
    <Route element={<AppShell />}>
      <Route element={<PublicCompetitionRoute />}>
        <Route index element={<HomePage />} />
        <Route path="matchs" element={<MatchesPage />} />
        <Route path="matchs/:matchId" element={<MatchDetailPage />} />
        <Route path="equipes/:teamId" element={<TeamPage />} />
        <Route path="classements" element={<StandingsPage />} />
        <Route path="classements/buteurs" element={<StandingsPage type="goals" />} />
        <Route path="classements/passeurs" element={<StandingsPage type="assists" />} />
        <Route path="classements/cartons" element={<StandingsPage type="cards" />} />
        <Route path="statistiques" element={<StatisticsPage />} />
        <Route path="communaute" element={<CommunityPage />} />
        <Route path="communaute/:discussionId" element={<DiscussionPage />} />
        <Route path="communiques" element={<AnnouncementsPage />} />
      </Route>
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profil" element={<ProfilePage />} />
      <Route path="parametres" element={<PreferencesPage />} />
      <Route path="connexion" element={<AuthenticationPage />} />
      <Route path="inscription" element={<AuthenticationPage register />} />
      <Route path="gestion/nouveau" element={<HomePage createOnly />} />
      <Route path="gestion" element={<PermissionRoute permission="competition:manage" draftAllowed><ManagementHomePage /></PermissionRoute>} />
      <Route path="gestion/membres" element={<PermissionRoute permission="competition:manage" draftAllowed><RolesManagementPage /></PermissionRoute>} />
      <Route path="gestion/matchs" element={<PermissionRoute permission="match:manage:assigned"><ManagerMatchesPage /></PermissionRoute>} />
      <Route path="gestion/matchs/:id/live" element={<PermissionRoute permission="match:manage:assigned"><LiveConsolePage /></PermissionRoute>} />
      <Route path="gestion/equipes" element={<PermissionRoute permission="competition:manage" draftAllowed><TeamsManagementPage /></PermissionRoute>} />
      <Route path="gestion/calendrier" element={<PermissionRoute permission="competition:manage" draftAllowed><ScheduleManagementPage /></PermissionRoute>} />
      <Route path="gestion/annonces" element={<PermissionRoute permission="competition:manage"><AnnouncementManagementPage /></PermissionRoute>} />
      <Route path="gestion/forum" element={<PermissionRoute permission="forum:moderate"><ModerationPage /></PermissionRoute>} />
      <Route path="gestion/partage" element={<PermissionRoute permission="competition:share"><SharingPage /></PermissionRoute>} />
      <Route path="gestion/parametres" element={<PermissionRoute permission="competition:manage" draftAllowed><SettingsPage /></PermissionRoute>} />
      <Route path="gestion/systeme" element={<PermissionRoute permission="system:admin:manage"><SystemAdminPage /></PermissionRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>;
}

export default function AppRouter() {
  return <RouteContent />;
}