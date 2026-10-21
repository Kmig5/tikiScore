package com.tikiscore_server.forum.dto;

import com.tikiscore_server.forum.ForumCategory;
import java.util.UUID;

public record ForumCategoryResponse(UUID id, String name) {
    public static ForumCategoryResponse from(ForumCategory category) {
        return new ForumCategoryResponse(category.getId(), category.getName());
    }
}