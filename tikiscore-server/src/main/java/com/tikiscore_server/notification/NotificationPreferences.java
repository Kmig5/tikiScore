package com.tikiscore_server.notification;

import com.tikiscore_server.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "notification_preferences", uniqueConstraints = @UniqueConstraint(
        name = "uk_notification_preferences_user", columnNames = "user_id"))
public class NotificationPreferences extends com.tikiscore_server.common.Entity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_notification_preferences_user"))
    private User user;

    @Column(name = "match_reminders", nullable = false)
    private boolean matchReminders = true;

    @Column(name = "match_start_end", nullable = false)
    private boolean matchStartEnd = true;

    @Column(name = "goals", nullable = false)
    private boolean goals;

    @Column(name = "schedule_changes", nullable = false)
    private boolean scheduleChanges = true;

    @Column(name = "announcements", nullable = false)
    private boolean announcements = true;

    @Column(name = "forum_replies", nullable = false)
    private boolean forumReplies = true;
}