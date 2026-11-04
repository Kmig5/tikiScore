import { Bell, CalendarDays, ChartNoAxesCombined, FileText, House, MessageCircle, Settings, ShieldCheck, Share2, Trophy, UsersRound, Whistle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Permission } from "../domain/types";

export interface NavigationItem {
  label: string;
  to: string;
  icon: LucideIcon;
  primary?: boolean;
  permission?: Permission;
  availableInDraft?: boolean;
  group: "competition" | "personal" | "management";
}

export const navigationItems: NavigationItem[] = [
  { label: "Accueil", to: "/", icon: House, primary: true, group: "competition" },
  { label: "Matchs", to: "/matchs", icon: CalendarDays, primary: true, group: "competition" },
  { label: "Classements", to: "/classements", icon: Trophy, primary: true, group: "competition" },
  { label: "Statistiques", to: "/statistiques", icon: ChartNoAxesCombined, group: "competition" },
  { label: "Communauté", to: "/communaute", icon: MessageCircle, primary: true, group: "competition" },
  { label: "Notifications", to: "/notifications", icon: Bell, group: "personal" },
  { label: "Paramètres", to: "/parametres", icon: Settings, primary: true, group: "personal" },
  { label: "Gestion des matchs", to: "/gestion/matchs", icon: Whistle, permission: "match:manage:assigned", group: "management" },
  { label: "Administration", to: "/gestion", icon: ShieldCheck, permission: "competition:manage", group: "management", availableInDraft: true },
  { label: "Membres et rôles", to: "/gestion/membres", icon: UsersRound, permission: "competition:manage", group: "management", availableInDraft: true },
  { label: "Administration système", to: "/gestion/systeme", icon: ShieldCheck, permission: "system:admin:manage", group: "management" },
  { label: "Équipes et joueurs", to: "/gestion/equipes", icon: UsersRound, permission: "competition:manage", group: "management", availableInDraft: true },
  { label: "Calendrier", to: "/gestion/calendrier", icon: CalendarDays, permission: "competition:manage", group: "management", availableInDraft: true },
  { label: "Annonces", to: "/gestion/annonces", icon: FileText, permission: "competition:manage", group: "management" },
  { label: "Modération", to: "/gestion/forum", icon: MessageCircle, permission: "forum:moderate", group: "management" },
  { label: "Partage", to: "/gestion/partage", icon: Share2, permission: "competition:share", group: "management" },
  { label: "Paramètres", to: "/gestion/parametres", icon: Settings, permission: "competition:manage", group: "management", availableInDraft: true },
];

export function getVisibleNavigation(permissions: Permission[], isDraft = false): NavigationItem[] {
  const visibleItems = navigationItems.filter((item) => (!item.permission || permissions.includes(item.permission))
    && (!isDraft || item.group === "personal" || item.availableInDraft));
  const contextualDestination = permissions.includes("competition:manage") ? "/gestion"
    : permissions.includes("system:admin:manage") ? "/gestion/systeme"
      : permissions.includes("match:manage:assigned") ? "/gestion/matchs"
        : permissions.includes("forum:moderate") ? "/gestion/forum"
          : "/communaute";
  const fixedDestinations = new Set(["/", "/matchs", "/classements", "/parametres"]);
  return visibleItems.map((item) => ({
    ...item,
    primary: fixedDestinations.has(item.to) || item.to === contextualDestination,
  }));
}