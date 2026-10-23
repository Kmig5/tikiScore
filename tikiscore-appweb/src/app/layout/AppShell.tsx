import { ArrowLeft, Bell, Settings2, Share2, Volleyball } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDemoAccess } from "../useDemoAccess";
import { getVisibleNavigation } from "../navigation";
import { hasPermission } from "../../domain/permissions";
import { useTikiScoreData, useTikiScoreStatus } from "../hooks";
import { tikiScoreService } from "../../services/tikiScoreService";
import styles from "./AppShell.module.css";

export default function AppShell() {
  const { user, permissions, signOut } = useDemoAccess();
  const data = useTikiScoreData();
  const dataStatus = useTikiScoreStatus();
  const location = useLocation();
  const navigate = useNavigate();
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
          <span className={styles.connectionFlag}><span />API</span>
          {user ? <><span className={styles.userName}>{user.displayName}</span><button className={styles.signOutButton} type="button" onClick={() => { void signOut().catch((error: unknown) => console.error("Échec de la déconnexion.", error)); }}>Déconnexion</button></> : <Link className={styles.signInLink} to="/connexion">Connexion</Link>}
          <NavLink className={styles.headerIcon} to="/notifications" aria-label={`Notifications, ${unreadCount} non lues`}>
            <Bell size={20} aria-hidden="true" />
            {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount}</span>}
          </NavLink>
          <NavLink className={styles.headerIcon} to="/parametres" aria-label="Paramètres"><Settings2 size={20} aria-hidden="true" /></NavLink>
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
          {location.pathname !== "/" && <button className={styles.backButton} type="button" onClick={() => {
            if (window.history.state?.idx > 0) navigate(-1);
            else navigate("/");
          }}><ArrowLeft size={17} aria-hidden="true" />Retour</button>}
          {dataStatus.state !== "ready" && <div className={`${styles.apiNotice} ${dataStatus.state === "error" ? styles.apiError : ""}`} role={dataStatus.state === "error" ? "alert" : "status"}>
            <span>{dataStatus.message}</span>{dataStatus.state === "error" && <button type="button" onClick={() => { void tikiScoreService.refresh(); }}>Réessayer</button>}
          </div>}
          <Outlet />
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
