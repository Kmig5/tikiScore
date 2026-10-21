package com.tikiscore_server.forum;

import com.tikiscore_server.championat.Championat;
import com.tikiscore_server.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "forum_discussions", indexes = @Index(
        name = "ix_forum_discussion_championship_created", columnList = "championship_id, created_at"))
public class Discussion extends com.tikiscore_server.common.Entity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "championship_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_forum_discussion_championship"))
    private Championat championship;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_forum_discussion_category"))
    private ForumCategory category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_forum_discussion_author"))
    private User author;

    @Column(name = "title", nullable = false, length = 180)
    private String title;

    @Column(name = "body", nullable = false, length = 5000)
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DiscussionStatus status = DiscussionStatus.OPEN;

    @Column(name = "pinned", nullable = false)
    private boolean pinned;

    @Column(name = "hidden", nullable = false)
    private boolean hidden;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderated_by_id", foreignKey = @ForeignKey(name = "fk_forum_discussion_moderator"))
    private User moderatedBy;

    @Column(name = "moderated_at")
    private Instant moderatedAt;
}