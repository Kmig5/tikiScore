package com.tikiscore_server.group.dto;

import com.tikiscore_server.group.CompetitionGroup;
import java.util.UUID;

public record GroupResponse(UUID id, String name) {
    public static GroupResponse from(CompetitionGroup group) {
        return new GroupResponse(group.getId(), group.getName());
    }
}