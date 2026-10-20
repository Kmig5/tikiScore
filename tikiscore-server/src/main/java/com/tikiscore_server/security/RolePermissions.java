package com.tikiscore_server.security;

import com.tikiscore_server.role.RoleName;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public final class RolePermissions {

    private static final Set<Permission> PUBLIC_READ = EnumSet.of(Permission.CHAMPIONSHIP_READ);
    private static final Set<Permission> MEMBER = EnumSet.of(
            Permission.CHAMPIONSHIP_READ,
            Permission.PROFILE_READ,
            Permission.PROFILE_UPDATE,
            Permission.NOTIFICATIONS_MANAGE,
            Permission.FORUM_PARTICIPATE,
            Permission.FORUM_REPORT
    );
    private static final Set<Permission> ALL = EnumSet.allOf(Permission.class);

    private RolePermissions() {
    }

    public static Set<Permission> permissionsFor(Set<RoleName> roles) {
        Set<Permission> permissions = EnumSet.copyOf(PUBLIC_READ);
        for (RoleName role : roles) {
            permissions.addAll(permissionsFor(role));
        }
        return Set.copyOf(permissions);
    }

    public static Set<GrantedAuthority> authoritiesFor(Set<RoleName> roles) {
        return permissionsFor(roles).stream()
                .map(permission -> new SimpleGrantedAuthority("PERM_" + permission.name()))
                .collect(Collectors.toUnmodifiableSet());
    }

    private static Set<Permission> permissionsFor(RoleName role) {
        return switch (role) {
            case USER -> MEMBER;
            case MATCH_MANAGER -> EnumSet.of(Permission.CHAMPIONSHIP_READ, Permission.MATCH_MANAGE_ASSIGNED);
            case FORUM_MODERATOR -> EnumSet.of(
                    Permission.CHAMPIONSHIP_READ,
                    Permission.PROFILE_READ,
                    Permission.FORUM_PARTICIPATE,
                    Permission.FORUM_REPORT,
                    Permission.FORUM_MODERATE
            );
            case COMPETITION_ADMIN, ADMIN, ORGANISATEUR -> ALL;
            case TEAM_MANAGER -> MEMBER;
        };
    }
}