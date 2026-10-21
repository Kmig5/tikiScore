package com.tikiscore_server.standing;

import java.util.UUID;

public record StandingResponse(
        int position,
        UUID teamId,
        String teamName,
        UUID groupId,
        int played,
        int wins,
        int draws,
        int losses,
        int goalsFor,
        int goalsAgainst,
        int goalDifference,
        int points
) {
}