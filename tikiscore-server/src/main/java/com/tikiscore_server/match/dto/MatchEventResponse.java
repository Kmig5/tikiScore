package com.tikiscore_server.match.dto;

import com.tikiscore_server.match.MatchEvent;
import com.tikiscore_server.match.MatchEventState;
import com.tikiscore_server.match.MatchEventType;
import java.time.Instant;
import java.util.UUID;

public record MatchEventResponse(
        UUID id,
        UUID matchId,
        String clientEventId,
        String type,
        UUID teamId,
        UUID playerId,
        UUID relatedPlayerId,
        int minute,
        int addedTime,
        long sequence,
        Instant occurredAt,
        MatchEventState state,
        int homeScoreAfter,
        int awayScoreAfter
) {
    public static MatchEventResponse from(MatchEvent event) {
        return new MatchEventResponse(
                event.getId(),
                event.getMatch().getId(),
                event.getClientEventId(),
                mapType(event.getType()),
                event.getTeam() == null ? null : event.getTeam().getId(),
                event.getPlayer() == null ? null : event.getPlayer().getId(),
                event.getRelatedPlayer() == null ? null : event.getRelatedPlayer().getId(),
                event.getMinute(),
                event.getAddedTime(),
                event.getSequence(),
                event.getCreatedAt(),
                event.getState(),
                event.getHomeScoreAfter(),
                event.getAwayScoreAfter()
        );
    }

    private static String mapType(MatchEventType type) {
        return switch (type) {
            case MATCH_STARTED -> "periodStart";
            case HALF_TIME_STARTED -> "halftime";
            case SECOND_HALF_STARTED, MATCH_RESUMED -> "periodResume";
            case MATCH_ENDED -> "fullTime";
            case GOAL, OWN_GOAL, PENALTY_GOAL -> "goal";
            case YELLOW_CARD, SECOND_YELLOW_CARD -> "yellowCard";
            case RED_CARD -> "redCard";
            case SUBSTITUTION -> "substitution";
            default -> type.name().toLowerCase(java.util.Locale.ROOT);
        };
    }
}