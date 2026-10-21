package com.tikiscore_server.forum;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscussionReplyRepository extends JpaRepository<DiscussionReply, UUID> {

    @EntityGraph(attributePaths = "author")
    List<DiscussionReply> findAllByDiscussion_IdAndHiddenFalseOrderByCreatedAtAsc(UUID discussionId);

    java.util.Optional<DiscussionReply> findByIdAndDiscussion_Id(UUID replyId, UUID discussionId);

    java.util.Optional<DiscussionReply> findByIdAndDiscussion_Championship_IdAndHiddenFalse(
            UUID replyId, UUID championshipId);
}