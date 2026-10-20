package com.tikiscore_server.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank
        @Size(min = 3, max = 60)
        @Pattern(regexp = "^[\\p{L}\\p{N}._-]+$")
        String username,
        @NotBlank
        @Size(min = 2, max = 100)
        String displayName,
        @NotBlank
        @Size(min = 12, max = 72)
        String password
) {
}