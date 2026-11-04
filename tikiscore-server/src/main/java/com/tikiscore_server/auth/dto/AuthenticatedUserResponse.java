package com.tikiscore_server.auth.dto;

import java.util.Set;
import java.util.UUID;
import java.util.List;

public record AuthenticatedUserResponse(
        UUID id,
        String username,
        String displayName,
        Set<String> roles,
        Set<String> permissions,
        List<ChampionshipAccess> championships
) {
    public record ChampionshipAccess(
            UUID id,
            String name,
            String slug,
            String status,
            Set<String> roles,
            Set<String> permissions
    ) {
    }
}