package com.tikiscore_server.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GroupRequest(@NotBlank @Size(max = 80) String name) {
}