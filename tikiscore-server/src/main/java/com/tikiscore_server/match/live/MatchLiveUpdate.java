package com.tikiscore_server.match.live;

import com.tikiscore_server.match.dto.MatchEventResponse;
import com.tikiscore_server.match.dto.MatchResponse;
import java.time.Instant;
import java.util.UUID;

public record MatchLiveUpdate(
        UUID messageId,
        String type,
        UUID matchId,
        long sequence,
        Instant serverTime,
        MatchResponse match,
        MatchEventResponse event
) {
}