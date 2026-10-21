package com.tikiscore_server.notification.dto;

import com.tikiscore_server.notification.Notification;
import com.tikiscore_server.notification.NotificationType;
import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String title,
        String message,
        Instant createdAt,
        String category,
        boolean read
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(notification.getId(), notification.getTitle(), notification.getMessage(),
                notification.getCreatedAt(), mapCategory(notification.getType()), notification.getReadAt() != null);
    }

    private static String mapCategory(NotificationType type) {
        return switch (type) {
            case MATCH_REMINDER, MATCH_STARTED, MATCH_FINISHED, GOAL -> "match";
            case SCHEDULE_CHANGED, MATCH_POSTPONED, MATCH_CANCELLED -> "schedule";
            case OFFICIAL_ANNOUNCEMENT -> "announcement";
            case FORUM_REPLY -> "discussion";
        };
    }
}