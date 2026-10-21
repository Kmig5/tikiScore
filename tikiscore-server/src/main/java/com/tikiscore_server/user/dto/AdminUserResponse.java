package com.tikiscore_server.user.dto;

import com.tikiscore_server.user.User;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public record AdminUserResponse(UUID id, String username, String displayName, Set<String> roles) {
    public static AdminUserResponse from(User user) {
        Set<String> roles = user.getRoles().stream().map(role -> role.getName().name()).collect(Collectors.toUnmodifiableSet());
        return new AdminUserResponse(user.getId(), user.getUsername(), user.getDisplayName(), roles);
    }
}