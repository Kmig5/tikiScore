package com.tikiscore_server.forum.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ForumCategoryRequest(@NotBlank @Size(max = 80) String name) {
}