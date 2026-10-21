package com.tikiscore_server.equipe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record TeamRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 20) String shortName,
        @Size(max = 120) String locality,
        @Size(max = 30) String primaryColor,
        @Size(max = 30) String secondaryColor,
        UUID groupId
) {
}