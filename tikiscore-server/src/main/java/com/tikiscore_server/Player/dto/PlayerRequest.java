package com.tikiscore_server.Player.dto;

import com.tikiscore_server.Player.enums.Position;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PlayerRequest(
        @NotBlank @Size(max = 120) String displayName,
        @NotNull @Min(1) @Max(99) Integer jerseyNumber,
        @NotNull Position position
) {
}