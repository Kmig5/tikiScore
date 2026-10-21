package com.tikiscore_server.announcement.dto;

import com.tikiscore_server.announcement.AnnouncementPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AnnouncementRequest(
        @NotBlank @Size(max = 180) String title,
        @NotBlank @Size(max = 500) String excerpt,
        @NotBlank @Size(max = 10000) String body,
        @NotNull AnnouncementPriority priority,
        boolean showOnHome
) {
}