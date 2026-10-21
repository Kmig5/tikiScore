package com.tikiscore_server.group;

import com.tikiscore_server.group.dto.GroupRequest;
import com.tikiscore_server.group.dto.GroupResponse;
import com.tikiscore_server.group.dto.TeamAssignmentRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CompetitionGroupController {

    private final CompetitionGroupService groupService;

    public CompetitionGroupController(CompetitionGroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping("/public/groups")
    public List<GroupResponse> getGroups() {
        return groupService.getPublicGroups();
    }

    @PostMapping("/admin/groups")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public ResponseEntity<GroupResponse> createGroup(@Valid @RequestBody GroupRequest request) {
        GroupResponse created = groupService.createGroup(request);
        return ResponseEntity.created(URI.create("/api/admin/groups/" + created.id())).body(created);
    }

    @PatchMapping("/admin/groups/{groupId}")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public GroupResponse updateGroup(@PathVariable UUID groupId, @Valid @RequestBody GroupRequest request) {
        return groupService.updateGroup(groupId, request);
    }

    @PutMapping("/admin/groups/{groupId}/teams")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public List<GroupResponse> assignTeams(
            @PathVariable UUID groupId,
            @Valid @RequestBody TeamAssignmentRequest request
    ) {
        return groupService.assignTeams(groupId, request);
    }
}