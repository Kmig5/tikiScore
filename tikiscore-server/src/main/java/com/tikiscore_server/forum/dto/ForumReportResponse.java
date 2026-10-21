package com.tikiscore_server.forum.dto;

import com.tikiscore_server.forum.ForumReport;
import java.time.Instant;
import java.util.UUID;

public record ForumReportResponse(
        UUID id,
        UUID discussionId,
        UUID replyId,
        String reason,
        Instant createdAt,
        boolean resolved
) {
    public static ForumReportResponse from(ForumReport report) {
        return new ForumReportResponse(report.getId(), report.getDiscussion().getId(),
                report.getReply() == null ? null : report.getReply().getId(), report.getReason(),
                report.getCreatedAt(), report.isResolved());
    }
}