package com.tikiscore_server.Player.dto;

import com.tikiscore_server.Player.Player;
import com.tikiscore_server.Player.enums.Position;
import java.util.UUID;

public record PlayerResponse(UUID id, String displayName, Integer jerseyNumber, Position position, UUID teamId) {
    public static PlayerResponse from(Player player) {
        return new PlayerResponse(
                player.getId(),
                player.getDisplayName(),
                player.getJerseyNumber(),
                player.getPosition(),
                player.getEquipe().getId()
        );
    }
}