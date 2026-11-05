package com.tikiscore_server.match.rating;

import java.util.List;
import java.util.UUID;

public record MatchPlayerRatingResponse(
        UUID matchId,
        String matchStatus,
        boolean ratingsOpen,
        boolean resultsVisible,
        List<PlayerRating> players
) {
    public record PlayerRating(
            UUID playerId,
            UUID teamId,
            String playerName,
            String teamName,
            Integer myRating,
            Double averageRating,
            long ratingCount,
            boolean manOfTheMatch
    ) {
    }
}