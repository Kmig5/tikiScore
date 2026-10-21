package com.tikiscore_server.match.dto;

import com.tikiscore_server.match.Match;
import com.tikiscore_server.match.MatchStatus;
import java.time.Instant;
import java.util.UUID;

public record MatchResponse(
        UUID id,
        UUID groupId,
        UUID homeTeamId,
        String homeTeamName,
        UUID awayTeamId,
        String awayTeamName,
        Instant startsAt,
        String venue,
        String status,
        int homeScore,
        int awayScore,
        int minute,
        long version
) {
    public static MatchResponse from(Match match) {
        return new MatchResponse(
                match.getId(),
                match.getGroup() == null ? null : match.getGroup().getId(),
                match.getHomeTeam().getId(),
                match.getHomeTeam().getName(),
                match.getAwayTeam().getId(),
                match.getAwayTeam().getName(),
                match.getStartsAt(),
                match.getVenue(),
                mapStatus(match.getStatus()),
                match.getHomeScore(),
                match.getAwayScore(),
                match.getMinute(),
                match.getVersion()
        );
    }

    private static String mapStatus(MatchStatus status) {
        return switch (status) {
            case SCHEDULED -> "scheduled";
            case LIVE_FIRST_HALF, LIVE_SECOND_HALF, PAUSED -> "live";
            case HALF_TIME -> "halftime";
            case FINISHED -> "finished";
            case POSTPONED -> "postponed";
            case CANCELLED, ABANDONED -> "cancelled";
        };
    }
}