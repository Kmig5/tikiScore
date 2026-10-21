package com.tikiscore_server.user;

import com.tikiscore_server.user.dto.AdminUserResponse;
import com.tikiscore_server.user.dto.RoleAssignmentRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public List<AdminUserResponse> getUsers() {
        return adminUserService.getUsers();
    }

    @PatchMapping("/{userId}/roles")
    public AdminUserResponse assignRoles(
            Authentication authentication,
            @PathVariable UUID userId,
            @Valid @RequestBody RoleAssignmentRequest request
    ) {
        return adminUserService.assignRoles(userId, (UUID) authentication.getPrincipal(), request);
    }
}