package com.tikiscore_server.championat;

import com.tikiscore_server.championat.dto.ChampionatResponse;
import com.tikiscore_server.championat.dto.CreateChampionatRequest;
import com.tikiscore_server.championat.dto.UpdateChampionatRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ChampionatController {

    private final ChampionatService championatService;

    public ChampionatController(ChampionatService championatService) {
        this.championatService = championatService;
    }

    @GetMapping("/public/competition")
    public ChampionatResponse getPublicChampionat() {
        return championatService.getPublicChampionat();
    }

    @GetMapping("/admin/competition")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public ChampionatResponse getAdminChampionat() {
        return championatService.getAdminChampionat();
    }

    @PostMapping("/admin/competition")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public ResponseEntity<ChampionatResponse> createChampionat(
            Authentication authentication,
            @Valid @RequestBody CreateChampionatRequest request
    ) {
        ChampionatResponse created = championatService.createChampionat((UUID) authentication.getPrincipal(), request);
        return ResponseEntity.created(URI.create("/api/admin/competition")).body(created);
    }

    @PatchMapping("/admin/competition")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public ChampionatResponse updateChampionat(@Valid @RequestBody UpdateChampionatRequest request) {
        return championatService.updateChampionat(request);
    }

    @PostMapping("/admin/competition/publish")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public ChampionatResponse publishChampionat() {
        return championatService.publishChampionat();
    }
}