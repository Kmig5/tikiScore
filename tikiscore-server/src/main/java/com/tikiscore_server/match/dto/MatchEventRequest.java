package com.tikiscore_server.match.dto;

import com.tikiscore_server.match.MatchEventType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record MatchEventRequest(
        @NotBlank @Size(max = 100) String clientEventId,
        @NotNull MatchEventType type,
        @Min(0) @Max(150) int minute,
        @Min(0) @Max(30) int addedTime,
        UUID teamId,
        UUID playerId,
        UUID relatedPlayerId,
        @Min(0) Integer correctedHomeScore,
        @Min(0) Integer correctedAwayScore
) {
}