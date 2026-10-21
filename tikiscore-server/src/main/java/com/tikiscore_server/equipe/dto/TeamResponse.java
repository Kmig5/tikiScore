package com.tikiscore_server.equipe.dto;

import com.tikiscore_server.equipe.Equipe;
import java.util.UUID;

public record TeamResponse(
        UUID id,
        String name,
        String shortName,
        String locality,
        String primaryColor,
        String secondaryColor,
        UUID groupId
) {
    public static TeamResponse from(Equipe team) {
        return new TeamResponse(
                team.getId(),
                team.getName(),
                valueOrEmpty(team.getShortName()),
                valueOrEmpty(team.getLocality()),
                valueOrEmpty(team.getPrimaryColor()),
                valueOrEmpty(team.getSecondaryColor()),
                team.getGroup() == null ? null : team.getGroup().getId()
        );
    }

    private static String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }
}