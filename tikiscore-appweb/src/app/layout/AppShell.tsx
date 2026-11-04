import { Bell, LogOut, Share2, Volleyball } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDemoAccess } from "../useDemoAccess";
import { getVisibleNavigation } from "../navigation";
import { hasPermission } from "../../domain/permissions";
import { useTikiScoreData, useTikiScoreStatus } from "../hooks";
import { tikiScoreService } from "../../services/tikiScoreService";
import { getActiveChampionshipId } from "../../services/api";
import Select from "../../composants/ui/Select";
import styles from "./AppShell.module.css";

export default function AppShell() {
  const { user, publicChampionships, permissions, signOut, switchChampionship, isSwitchingChampionship } = useDemoAccess();
  const data = useTikiScoreData();
  const dataStatus = useTikiScoreStatus();
  const location = useLocation();
  const navigate = useNavigate();
  const championshipOptions = [...new Map([...(user?.championships ?? []), ...publicChampionships].map((championship) => [championship.id, championship])).values()];
  const isDraft = user?.championships.some((championship) => championship.id === getActiveChampionshipId() && championship.status === "BROUILLON") ?? false;
  const visibleNavigation = getVisibleNavigation(permissions, isDraft);
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
          {championshipOptions.length > 1 && <Select label="Championnat actif" fullWidth={false} options={championshipOptions.map((championship) => ({ value: championship.id, label: championship.name }))} value={getActiveChampionshipId() ?? ""} onChange={(event) => { void switchChampionship(event.target.value).then(() => navigate("/")).catch((error: unknown) => console.error("Échec du changement de championnat.", error)); }} />}
          {user ? <><span className={styles.userName}>{user.displayName}</span><button className={styles.signOutButton} type="button" title="Déconnexion" aria-label="Déconnexion" onClick={() => { void signOut().catch((error: unknown) => console.error("Échec de la déconnexion.", error)); }}><LogOut size={18} aria-hidden="true" /></button></> : <Link className={styles.signInLink} to="/connexion">Connexion</Link>}
          <NavLink className={styles.headerIcon} to="/notifications" aria-label={`Notifications, ${unreadCount} non lues`}>
            <Bell size={20} aria-hidden="true" />
            {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount}</span>}
          </NavLink>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar} aria-label="Navigation principale">
          <div className={styles.championshipBlock}>
            <span className={styles.eyebrow}>CHAMPIONNAT</span>
            <strong>{data.championship.name || "TikiScore"}</strong>
            {data.championship.name && <span>{data.championship.edition} · {data.championship.locality}</span>}
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
          {dataStatus.state !== "ready" && <div className={`${styles.apiNotice} ${dataStatus.state === "error" ? styles.apiError : ""}`} role={dataStatus.state === "error" ? "alert" : "status"}>
            <span>{dataStatus.message}</span>{dataStatus.state === "error" && <button type="button" onClick={() => { void tikiScoreService.refresh(); }}>Réessayer</button>}
          </div>}
          {isSwitchingChampionship ? <div className={styles.apiNotice} role="status">Chargement du championnat…</div> : <Outlet />}
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
