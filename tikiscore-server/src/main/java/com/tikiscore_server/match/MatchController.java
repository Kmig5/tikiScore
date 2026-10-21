package com.tikiscore_server.match;

import com.tikiscore_server.match.dto.AssignManagersRequest;
import com.tikiscore_server.match.dto.CreateMatchRequest;
import com.tikiscore_server.match.dto.MatchEventRequest;
import com.tikiscore_server.match.dto.MatchEventResponse;
import com.tikiscore_server.match.dto.MatchResponse;
import com.tikiscore_server.match.dto.UpdateMatchRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class MatchController {

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @GetMapping("/public/matches")
    public List<MatchResponse> getMatches() {
        return matchService.getPublicMatches();
    }

    @GetMapping("/public/matches/today")
    public List<MatchResponse> getMatchesToday() {
        return matchService.getMatchesToday();
    }

    @GetMapping("/public/matches/upcoming")
    public List<MatchResponse> getUpcomingMatches() {
        return matchService.getUpcomingMatches();
    }

    @GetMapping("/public/matches/live")
    public List<MatchResponse> getLiveMatches() {
        return matchService.getLiveMatches();
    }

    @GetMapping("/public/matches/{matchId}")
    public MatchResponse getMatch(@PathVariable UUID matchId) {
        return matchService.getPublicMatch(matchId);
    }

    @GetMapping("/public/matches/{matchId}/events")
    public List<MatchEventResponse> getEvents(
            @PathVariable UUID matchId,
            @RequestParam(defaultValue = "0") long afterSequence
    ) {
        return matchService.getEvents(matchId, afterSequence);
    }

    @PostMapping("/admin/matches")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public ResponseEntity<MatchResponse> createMatch(@Valid @RequestBody CreateMatchRequest request) {
        MatchResponse created = matchService.createMatch(request);
        return ResponseEntity.created(URI.create("/api/public/matches/" + created.id())).body(created);
    }

    @PatchMapping("/admin/matches/{matchId}")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public MatchResponse updateMatch(
            @PathVariable UUID matchId,
            @Valid @RequestBody UpdateMatchRequest request
    ) {
        return matchService.updateMatch(matchId, request);
    }

    @PostMapping("/admin/matches/{matchId}/assign-manager")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public MatchResponse assignManagers(
            @PathVariable UUID matchId,
            Authentication authentication,
            @Valid @RequestBody AssignManagersRequest request
    ) {
        return matchService.assignManagers(matchId, request, userId(authentication));
    }

    @PostMapping("/admin/matches/{matchId}/postpone")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public MatchResponse postpone(Authentication authentication, @PathVariable UUID matchId) {
        return matchService.postpone(matchId, userId(authentication));
    }

    @PostMapping("/admin/matches/{matchId}/cancel")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public MatchResponse cancel(Authentication authentication, @PathVariable UUID matchId) {
        return matchService.cancel(matchId, userId(authentication));
    }

    @GetMapping("/match-manager/matches")
    @PreAuthorize("hasAuthority('PERM_MATCH_MANAGE_ASSIGNED')")
    public List<MatchResponse> getAssignedMatches(Authentication authentication) {
        return matchService.getAssignedMatches(userId(authentication));
    }

    @GetMapping("/match-manager/matches/{matchId}")
    @PreAuthorize("hasAuthority('PERM_MATCH_MANAGE_ASSIGNED')")
    public MatchResponse getAssignedMatch(Authentication authentication, @PathVariable UUID matchId) {
        return matchService.getAssignedMatch(matchId, userId(authentication));
    }

    @PostMapping("/match-manager/matches/{matchId}/start")
    @PreAuthorize("hasAuthority('PERM_MATCH_MANAGE_ASSIGNED')")
    public MatchResponse start(Authentication authentication, @PathVariable UUID matchId) {
        return matchService.transition(matchId, userId(authentication), MatchStatus.LIVE_FIRST_HALF);
    }

    @PostMapping("/match-manager/matches/{matchId}/half-time")
    @PreAuthorize("hasAuthority('PERM_MATCH_MANAGE_ASSIGNED')")
    public MatchResponse halfTime(Authentication authentication, @PathVariable UUID matchId) {
        return matchService.transition(matchId, userId(authentication), MatchStatus.HALF_TIME);
    }

    @PostMapping("/match-manager/matches/{matchId}/resume")
    @PreAuthorize("hasAuthority('PERM_MATCH_MANAGE_ASSIGNED')")
    public MatchResponse resume(Authentication authentication, @PathVariable UUID matchId) {
        return matchService.resume(matchId, userId(authentication));
    }

    @PostMapping("/match-manager/matches/{matchId}/pause")
    @PreAuthorize("hasAuthority('PERM_MATCH_MANAGE_ASSIGNED')")
    public MatchResponse pause(Authentication authentication, @PathVariable UUID matchId) {
        return matchService.transition(matchId, userId(authentication), MatchStatus.PAUSED);
    }

    @PostMapping("/match-manager/matches/{matchId}/finish")
    @PreAuthorize("hasAuthority('PERM_MATCH_MANAGE_ASSIGNED')")
    public MatchResponse finish(Authentication authentication, @PathVariable UUID matchId) {
        return matchService.transition(matchId, userId(authentication), MatchStatus.FINISHED);
    }

    @PostMapping("/match-manager/matches/{matchId}/events")
    @PreAuthorize("hasAuthority('PERM_MATCH_MANAGE_ASSIGNED')")
    public MatchEventResponse recordEvent(
            Authentication authentication,
            @PathVariable UUID matchId,
            @Valid @RequestBody MatchEventRequest request
    ) {
        return matchService.recordEvent(matchId, userId(authentication), request);
    }

    @PostMapping("/match-manager/matches/{matchId}/events/{eventId}/cancel")
    @PreAuthorize("hasAuthority('PERM_MATCH_MANAGE_ASSIGNED')")
    public MatchEventResponse cancelEvent(
            Authentication authentication,
            @PathVariable UUID matchId,
            @PathVariable UUID eventId
    ) {
        return matchService.cancelEvent(matchId, eventId, userId(authentication));
    }

    private UUID userId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }
}