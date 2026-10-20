import { Bell, CalendarDays, ChartNoAxesCombined, FileText, House, MessageCircle, Settings2, ShieldCheck, Share2, Trophy, UserRound, UsersRound, Whistle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Permission } from "../domain/types";

export interface NavigationItem {
  label: string;
  to: string;
  icon: LucideIcon;
  primary?: boolean;
  permission?: Permission;
  group: "competition" | "personal" | "management";
}

export const navigationItems: NavigationItem[] = [
  { label: "Accueil", to: "/", icon: House, primary: true, group: "competition" },
  { label: "Matchs", to: "/matchs", icon: CalendarDays, primary: true, group: "competition" },
  { label: "Classements", to: "/classements", icon: Trophy, primary: true, group: "competition" },
  { label: "Statistiques", to: "/statistiques", icon: ChartNoAxesCombined, group: "competition" },
  { label: "Communauté", to: "/communaute", icon: MessageCircle, primary: true, group: "competition" },
  { label: "Notifications", to: "/notifications", icon: Bell, group: "personal" },
  { label: "Profil", to: "/profil", icon: UserRound, primary: true, group: "personal" },
  { label: "Gestion des matchs", to: "/gestion/matchs", icon: Whistle, permission: "match:manage:assigned", group: "management" },
  { label: "Administration", to: "/gestion", icon: ShieldCheck, permission: "competition:manage", group: "management" },
  { label: "Équipes et joueurs", to: "/gestion/equipes", icon: UsersRound, permission: "competition:manage", group: "management" },
  { label: "Calendrier", to: "/gestion/calendrier", icon: CalendarDays, permission: "competition:manage", group: "management" },
  { label: "Annonces", to: "/gestion/annonces", icon: FileText, permission: "competition:manage", group: "management" },
  { label: "Modération", to: "/gestion/forum", icon: MessageCircle, permission: "forum:moderate", group: "management" },
  { label: "Partage", to: "/gestion/partage", icon: Share2, permission: "competition:share", group: "management" },
  { label: "Paramètres", to: "/gestion/parametres", icon: Settings2, permission: "competition:manage", group: "management" },
];

export function getVisibleNavigation(permissions: Permission[]): NavigationItem[] {
  return navigationItems.filter((item) => !item.permission || permissions.includes(item.permission));
}