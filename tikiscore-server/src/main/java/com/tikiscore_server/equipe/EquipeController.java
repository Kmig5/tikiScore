package com.tikiscore_server.equipe;

import com.tikiscore_server.equipe.dto.TeamRequest;
import com.tikiscore_server.equipe.dto.TeamResponse;
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
public class EquipeController {

    private final EquipeService equipeService;

    public EquipeController(EquipeService equipeService) {
        this.equipeService = equipeService;
    }

    @GetMapping("/public/teams")
    public List<TeamResponse> getTeams() {
        return equipeService.getPublicTeams();
    }

    @GetMapping("/public/teams/{teamId}")
    public TeamResponse getTeam(@PathVariable UUID teamId) {
        return equipeService.getPublicTeam(teamId);
    }

    @PostMapping("/admin/teams")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public ResponseEntity<TeamResponse> createTeam(@Valid @RequestBody TeamRequest request) {
        TeamResponse created = equipeService.createTeam(request);
        return ResponseEntity.created(URI.create("/api/public/teams/" + created.id())).body(created);
    }

    @PatchMapping("/admin/teams/{teamId}")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public TeamResponse updateTeam(@PathVariable UUID teamId, @Valid @RequestBody TeamRequest request) {
        return equipeService.updateTeam(teamId, request);
    }
}