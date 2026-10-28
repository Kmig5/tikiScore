package com.tikiscore_server.match.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public record UpdateMatchRequest(
        @NotNull
        Instant startsAt,
        @Size(max = 180)
        String venue,
        UUID groupId,
        @NotNull
        UUID homeTeamId,
        @NotNull
        UUID awayTeamId
        ) {

}