package com.tikiscore_server.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.tikiscore_server.role.RoleName;
import java.util.Set;
import org.junit.jupiter.api.Test;

class RolePermissionsTest {

    @Test
    void memberCannotManageCompetition() {
        Set<Permission> permissions = RolePermissions.permissionsFor(Set.of(RoleName.USER));

        assertTrue(permissions.contains(Permission.PROFILE_UPDATE));
        assertFalse(permissions.contains(Permission.COMPETITION_MANAGE));
        assertFalse(permissions.contains(Permission.SYSTEM_ADMIN_MANAGE));
    }

    @Test
    void matchManagerCanManageAssignedMatchesOnly() {
        Set<Permission> permissions = RolePermissions.permissionsFor(Set.of(RoleName.MATCH_MANAGER));

        assertTrue(permissions.contains(Permission.MATCH_MANAGE_ASSIGNED));
        assertFalse(permissions.contains(Permission.COMPETITION_MANAGE));
        assertFalse(permissions.contains(Permission.FORUM_MODERATE));
    }

    @Test
    void forumModeratorCannotManageCompetition() {
        Set<Permission> permissions = RolePermissions.permissionsFor(Set.of(RoleName.FORUM_MODERATOR));

        assertTrue(permissions.contains(Permission.FORUM_MODERATE));
        assertFalse(permissions.contains(Permission.COMPETITION_MANAGE));
        assertFalse(permissions.contains(Permission.MATCH_MANAGE_ASSIGNED));
    }

    @Test
    void competitionAdminDoesNotReceiveSystemAdministration() {
        Set<Permission> permissions = RolePermissions.permissionsFor(Set.of(RoleName.COMPETITION_ADMIN));

        assertTrue(permissions.contains(Permission.COMPETITION_MANAGE));
        assertTrue(permissions.contains(Permission.COMPETITION_SHARE));
        assertFalse(permissions.contains(Permission.SYSTEM_ADMIN_MANAGE));
    }

    @Test
    void teamManagerRemainsLimitedToMemberPermissions() {
        assertTrue(RolePermissions.permissionsFor(Set.of(RoleName.TEAM_MANAGER))
                .equals(RolePermissions.permissionsFor(Set.of(RoleName.USER))));
    }
}