package com.tikiscore_server.forum.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ReplyRequest(
        @NotBlank @Size(max = 3000) @Pattern(regexp = "[^<>]*") String body
) {
}