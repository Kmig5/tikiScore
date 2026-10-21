package com.tikiscore_server.Player;

import com.tikiscore_server.Player.dto.PlayerRequest;
import com.tikiscore_server.Player.dto.PlayerResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PlayerController {

    private final PlayerService playerService;

    public PlayerController(PlayerService playerService) {
        this.playerService = playerService;
    }

    @GetMapping("/public/teams/{teamId}/players")
    public List<PlayerResponse> getTeamPlayers(@PathVariable UUID teamId) {
        return playerService.getTeamPlayers(teamId);
    }

    @GetMapping("/public/players/{playerId}")
    public PlayerResponse getPlayer(@PathVariable UUID playerId) {
        return playerService.getPublicPlayer(playerId);
    }

    @PostMapping("/admin/teams/{teamId}/players")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public ResponseEntity<PlayerResponse> createPlayer(
            @PathVariable UUID teamId,
            @Valid @RequestBody PlayerRequest request
    ) {
        PlayerResponse created = playerService.createPlayer(teamId, request);
        return ResponseEntity.created(URI.create("/api/public/players/" + created.id())).body(created);
    }

    @PatchMapping("/admin/players/{playerId}")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public PlayerResponse updatePlayer(
            @PathVariable UUID playerId,
            @Valid @RequestBody PlayerRequest request
    ) {
        return playerService.updatePlayer(playerId, request);
    }
}