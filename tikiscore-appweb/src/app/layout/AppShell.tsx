import { Bell, CircleHelp, ShieldAlert, Share2, Volleyball } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useDemoAccess } from "../useDemoAccess";
import { getVisibleNavigation } from "../navigation";
import { hasPermission } from "../../domain/permissions";
import { useTikiScoreData } from "../hooks";
import ThemeToggle from "../../composants/ui/ThemeToggle";
import styles from "./AppShell.module.css";

const personaLabels = {
  visitor: "Visiteur",
  member: "Membre · aperçu",
  matchManager: "Gestionnaire · aperçu",
  moderator: "Modérateur · aperçu",
  administrator: "Administrateur · aperçu",
} as const;

export default function AppShell() {
  const { personaId, setPersonaId, permissions } = useDemoAccess();
  const data = useTikiScoreData();
  const location = useLocation();
  const visibleNavigation = getVisibleNavigation(permissions);
  const mobileNavigation = visibleNavigation.filter((item) => item.primary);
  const unreadCount = data.notifications.filter((notification) => !notification.read).length;
  const isManagement = location.pathname.startsWith("/gestion");

  return (
    <div className={styles.application}>
      <header className={styles.header}>
        <NavLink className={styles.brand} to="/" aria-label="TikiScore, accueil du championnat">
          <span className={styles.brandMark}><Volleyball size={21} aria-hidden="true" /></span>
          <span className={styles.brandName}>Tiki<span>Score</span></span>
        </NavLink>
        <div className={styles.headerRight}>
          <span className={styles.demoFlag}><span /> Données démo</span>
          <label className={styles.personaLabel}>
            <span>Profil aperçu</span>
            <select value={personaId} onChange={(event) => setPersonaId(event.target.value as keyof typeof personaLabels)} aria-label="Choisir un profil de démonstration">
              {Object.entries(personaLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
          <NavLink className={styles.headerIcon} to="/notifications" aria-label={`Notifications, ${unreadCount} non lues`}>
            <Bell size={20} aria-hidden="true" />
            {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount}</span>}
          </NavLink>
          <ThemeToggle />
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar} aria-label="Navigation principale">
          <div className={styles.championshipBlock}>
            <span className={styles.eyebrow}>CHAMPIONNAT</span>
            <strong>{data.championship.name}</strong>
            <span>{data.championship.edition} · {data.championship.locality}</span>
          </div>
          <nav className={styles.sidebarNav}>
            {visibleNavigation.filter((item) => item.group !== "management").map((item) => {
              const Icon = item.icon;
              return <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`}>
                <Icon size={18} aria-hidden="true" />{item.label}
                {item.label === "Notifications" && unreadCount > 0 && <span className={styles.navCount}>{unreadCount}</span>}
              </NavLink>;
            })}
          </nav>
          {visibleNavigation.some((item) => item.group === "management") && (
            <div className={styles.managementNav}>
              <span className={styles.eyebrow}>ESPACE GESTION</span>
              {visibleNavigation.filter((item) => item.group === "management").map((item) => {
                const Icon = item.icon;
                return <NavLink key={item.to} to={item.to} end={item.to === "/gestion"} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`}>
                  <Icon size={18} aria-hidden="true" />{item.label}
                </NavLink>;
              })}
            </div>
          )}
          {hasPermission(permissions, "competition:share") && <NavLink className={styles.shareLink} to="/gestion/partage"><Share2 size={17} aria-hidden="true" />Partager le championnat</NavLink>}
        </aside>

        <main className={`${styles.main} ${isManagement ? styles.managementMain : ""}`} id="main-content" tabIndex={-1}>
          <div className={styles.demoNotice} role="status">
            <ShieldAlert size={16} aria-hidden="true" />
            <span>Aperçu de démonstration · données locales, non enregistrées ni synchronisées.</span>
            <a href="#demo-details" aria-label="À propos du mode démonstration"><CircleHelp size={16} aria-hidden="true" /></a>
          </div>
          <Outlet />
          <p className={styles.demoDetails} id="demo-details">Les profils et permissions affichés servent uniquement à prévisualiser l’interface. Le serveur doit contrôler toute authentification et autorisation.</p>
        </main>
      </div>

      <nav className={styles.mobileNavigation} aria-label="Navigation mobile">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          return <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.mobileActive : ""}`}>
            <Icon size={20} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>;
        })}
      </nav>
    </div>
  );
}