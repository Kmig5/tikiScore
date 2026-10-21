package com.tikiscore_server.forum;

import com.tikiscore_server.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
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
@Table(name = "forum_reports")
public class ForumReport extends com.tikiscore_server.common.Entity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "discussion_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_forum_report_discussion"))
    private Discussion discussion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_id", foreignKey = @ForeignKey(name = "fk_forum_report_reply"))
    private DiscussionReply reply;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_forum_report_reporter"))
    private User reporter;

    @Column(name = "reason", nullable = false, length = 1000)
    private String reason;

    @Column(name = "resolved", nullable = false)
    private boolean resolved;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderator_id", foreignKey = @ForeignKey(name = "fk_forum_report_moderator"))
    private User moderator;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}