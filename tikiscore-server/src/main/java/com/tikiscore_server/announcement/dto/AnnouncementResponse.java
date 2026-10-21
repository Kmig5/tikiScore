package com.tikiscore_server.announcement.dto;

import com.tikiscore_server.announcement.Announcement;
import com.tikiscore_server.announcement.AnnouncementPriority;
import com.tikiscore_server.announcement.AnnouncementStatus;
import java.time.Instant;
import java.util.UUID;

public record AnnouncementResponse(
        UUID id,
        String title,
        String excerpt,
        String body,
        Instant publishedAt,
        String priority,
        AnnouncementStatus status,
        boolean official
) {
    public static AnnouncementResponse from(Announcement announcement) {
        return new AnnouncementResponse(announcement.getId(), announcement.getTitle(), announcement.getExcerpt(),
                announcement.getBody(), announcement.getPublishedAt(),
                announcement.getPriority() == AnnouncementPriority.IMPORTANT ? "important" : "normal",
                announcement.getStatus(), true);
    }
}