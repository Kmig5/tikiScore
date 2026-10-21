package com.tikiscore_server.forum.dto;

import com.tikiscore_server.forum.DiscussionReply;
import java.time.Instant;
import java.util.UUID;

public record DiscussionReplyResponse(UUID id, String authorName, String body, Instant createdAt, boolean hidden) {
    public static DiscussionReplyResponse from(DiscussionReply reply) {
        return new DiscussionReplyResponse(reply.getId(), reply.getAuthor().getDisplayName(), reply.getBody(),
                reply.getCreatedAt(), reply.isHidden());
    }
}