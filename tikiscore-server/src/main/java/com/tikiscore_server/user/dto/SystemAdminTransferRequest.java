package com.tikiscore_server.user.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record SystemAdminTransferRequest(@NotNull UUID targetUserId) {
}