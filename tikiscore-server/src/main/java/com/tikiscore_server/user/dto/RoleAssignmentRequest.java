package com.tikiscore_server.user.dto;

import com.tikiscore_server.role.RoleName;
import jakarta.validation.constraints.NotNull;
import java.util.Set;

public record RoleAssignmentRequest(@NotNull Set<RoleName> roles) {
}