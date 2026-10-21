package com.tikiscore_server.group.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record TeamAssignmentRequest(@NotNull List<UUID> teamIds) {
}