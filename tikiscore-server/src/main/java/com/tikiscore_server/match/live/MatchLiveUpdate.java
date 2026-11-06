package com.tikiscore_server.match.live;

import com.tikiscore_server.match.dto.MatchResponse;
import java.time.Instant;
import java.util.UUID;

public record MatchLiveUpdate(
        String type,
        UUID matchId,
        Instant serverTime,
        String status,
        int homeScore,
        int awayScore,
        int minute,
        long version
) {
    public static MatchLiveUpdate from(MatchResponse match, Instant serverTime) {
        return new MatchLiveUpdate("SCORE_SNAPSHOT", match.id(), serverTime, match.status(),
                match.homeScore(), match.awayScore(), match.minute(), match.version());
    }
}