package com.tikiscore_server.statistic;

import java.util.UUID;

public record PlayerStatisticResponse(
        UUID playerId,
        String playerName,
        UUID teamId,
        String teamName,
        long goals,
        long assists,
        long yellowCards,
        long redCards
) {
}