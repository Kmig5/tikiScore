import type { DemoPersonaId, Permission } from "./types";

const permissionMatrix: Record<DemoPersonaId, Permission[]> = {
  visitor: ["championship:read"],
  member: ["championship:read", "profile:read", "profile:update", "notifications:manage", "forum:participate", "forum:report"],
  matchManager: ["championship:read", "profile:read", "match:manage:assigned"],
  administrator: ["championship:read", "profile:read", "profile:update", "notifications:manage", "forum:participate", "forum:report", "forum:moderate", "match:manage:assigned", "competition:manage", "competition:share"],
  moderator: ["championship:read", "profile:read", "forum:participate", "forum:report", "forum:moderate"],
};

export function getDemoPermissions(personaId: DemoPersonaId): Permission[] {
  return permissionMatrix[personaId];
}

export function hasPermission(permissions: Permission[], permission: Permission): boolean {
  return permissions.includes(permission);
}