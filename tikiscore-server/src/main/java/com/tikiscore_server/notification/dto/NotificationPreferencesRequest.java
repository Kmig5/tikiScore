package com.tikiscore_server.notification.dto;

import jakarta.validation.constraints.NotNull;

public record NotificationPreferencesRequest(
        @NotNull Boolean matchReminders,
        @NotNull Boolean matchStartEnd,
        @NotNull Boolean goals,
        @NotNull Boolean scheduleChanges,
        @NotNull Boolean announcements,
        @NotNull Boolean forumReplies
) {
}