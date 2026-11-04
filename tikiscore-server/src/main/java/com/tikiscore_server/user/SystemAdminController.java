package com.tikiscore_server.user;

import com.tikiscore_server.user.dto.AdminUserResponse;
import com.tikiscore_server.user.dto.SystemAdminTransferRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system/admin")
@PreAuthorize("hasAuthority('PERM_SYSTEM_ADMIN_MANAGE')")
public class SystemAdminController {

    private final AdminUserService adminUserService;

    public SystemAdminController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping("/users")
    public List<AdminUserResponse> getUsers() {
        return adminUserService.getUsers();
    }

    @PatchMapping
    public AdminUserResponse transfer(
            Authentication authentication,
            @Valid @RequestBody SystemAdminTransferRequest request
    ) {
        return adminUserService.transferSystemAdmin(request.targetUserId(), (UUID) authentication.getPrincipal());
    }
}