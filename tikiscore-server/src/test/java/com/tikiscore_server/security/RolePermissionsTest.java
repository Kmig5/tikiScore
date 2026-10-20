package com.tikiscore_server.security;

import com.tikiscore_server.role.RoleName;
import java.util.Set;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RolePermissionsTest {

    @Test
    void rolesAccumulatePermissionsWithoutGrantingUnrelatedCapabilities() {
        Set<Permission> permissions = RolePermissions.permissionsFor(
                Set.of(RoleName.USER, RoleName.MATCH_MANAGER, RoleName.FORUM_MODERATOR));

        assertTrue(permissions.contains(Permission.PROFILE_UPDATE));
        assertTrue(permissions.contains(Permission.MATCH_MANAGE_ASSIGNED));
        assertTrue(permissions.contains(Permission.FORUM_MODERATE));
        assertFalse(permissions.contains(Permission.COMPETITION_MANAGE));
        assertFalse(permissions.contains(Permission.COMPETITION_SHARE));
    }

    @Test
    void forumModeratorDoesNotReceiveSportingPermissions() {
        Set<Permission> permissions = RolePermissions.permissionsFor(Set.of(RoleName.FORUM_MODERATOR));

        assertTrue(permissions.contains(Permission.FORUM_MODERATE));
        assertFalse(permissions.contains(Permission.MATCH_MANAGE_ASSIGNED));
        assertFalse(permissions.contains(Permission.COMPETITION_MANAGE));
    }
}