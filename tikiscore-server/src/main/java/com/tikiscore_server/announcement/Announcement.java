package com.tikiscore_server.announcement;

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
@Table(name = "announcements", indexes = @Index(
        name = "ix_announcement_championship_status_published",
        columnList = "championship_id, status, published_at"))
public class Announcement extends com.tikiscore_server.common.Entity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "championship_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_announcement_championship"))
    private Championat championship;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_announcement_author"))
    private User author;

    @Column(name = "title", nullable = false, length = 180)
    private String title;

    @Column(name = "excerpt", nullable = false, length = 500)
    private String excerpt;

    @Column(name = "body", nullable = false, length = 10000)
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private AnnouncementPriority priority = AnnouncementPriority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AnnouncementStatus status = AnnouncementStatus.DRAFT;

    @Column(name = "show_on_home", nullable = false)
    private boolean showOnHome;

    @Column(name = "published_at")
    private Instant publishedAt;
}