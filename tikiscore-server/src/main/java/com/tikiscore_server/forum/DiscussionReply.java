package com.tikiscore_server.forum;

import com.tikiscore_server.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "forum_replies", indexes = @Index(
        name = "ix_forum_reply_discussion_created", columnList = "discussion_id, created_at"))
public class DiscussionReply extends com.tikiscore_server.common.Entity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "discussion_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_forum_reply_discussion"))
    private Discussion discussion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_forum_reply_author"))
    private User author;

    @Column(name = "body", nullable = false, length = 3000)
    private String body;

    @Column(name = "hidden", nullable = false)
    private boolean hidden;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderated_by_id", foreignKey = @ForeignKey(name = "fk_forum_reply_moderator"))
    private User moderatedBy;

    @Column(name = "moderated_at")
    private Instant moderatedAt;
}