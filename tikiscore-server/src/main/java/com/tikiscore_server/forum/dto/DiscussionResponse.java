package com.tikiscore_server.forum.dto;

import com.tikiscore_server.forum.Discussion;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DiscussionResponse(
        UUID id,
        String category,
        String title,
        String body,
        String authorName,
        Instant createdAt,
        List<DiscussionReplyResponse> replies,
        boolean pinned,
        boolean closed,
        boolean hidden
) {
    public static DiscussionResponse from(Discussion discussion, List<DiscussionReplyResponse> replies) {
        return new DiscussionResponse(discussion.getId(), discussion.getCategory().getName(), discussion.getTitle(),
                discussion.getBody(), discussion.getAuthor().getDisplayName(), discussion.getCreatedAt(), replies,
                discussion.isPinned(), discussion.getStatus() == com.tikiscore_server.forum.DiscussionStatus.CLOSED,
                discussion.isHidden());
    }
}