package com.tikiscore_server.forum.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record DiscussionRequest(
        @NotNull UUID categoryId,
        @NotBlank @Size(max = 180) @Pattern(regexp = "[^<>]*") String title,
        @NotBlank @Size(max = 5000) @Pattern(regexp = "[^<>]*") String body
) {
}