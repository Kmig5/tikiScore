package com.tikiscore_server.match.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record AssignManagersRequest(@NotNull List<UUID> managerIds) {
}