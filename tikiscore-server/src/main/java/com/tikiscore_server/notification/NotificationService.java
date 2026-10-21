package com.tikiscore_server.notification;

import com.tikiscore_server.announcement.Announcement;
import com.tikiscore_server.championat.ChampionatRepository;
import com.tikiscore_server.forum.Discussion;
import com.tikiscore_server.match.Match;
import com.tikiscore_server.match.MatchEvent;
import com.tikiscore_server.match.MatchEventType;
import com.tikiscore_server.notification.dto.NotificationPageResponse;
import com.tikiscore_server.notification.dto.NotificationPreferencesRequest;
import com.tikiscore_server.notification.dto.NotificationResponse;
import com.tikiscore_server.user.User;
import com.tikiscore_server.user.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferencesRepository preferencesRepository;
    private final UserRepository userRepository;
    private final ChampionatRepository championatRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            NotificationPreferencesRepository preferencesRepository,
            UserRepository userRepository,
            ChampionatRepository championatRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.preferencesRepository = preferencesRepository;
        this.userRepository = userRepository;
        this.championatRepository = championatRepository;
    }

    @Transactional(readOnly = true)
    public NotificationPageResponse getNotifications(UUID userId, int page, int size) {
        Page<Notification> notifications = notificationRepository.findAllByUser_IdOrderByCreatedAtDesc(
                userId, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100)));
        return new NotificationPageResponse(notifications.getContent().stream()
                .map(NotificationResponse::from).toList(), notifications.getNumber(), notifications.getSize(),
                notifications.getTotalElements(), notifications.getTotalPages(),
                notificationRepository.countByUser_IdAndReadAtIsNull(userId));
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUser_IdAndReadAtIsNull(userId);
    }

    @Transactional
    public void markRead(UUID userId, UUID notificationId) {
        Notification notification = notificationRepository.findByIdAndUser_Id(notificationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification introuvable."));
        if (notification.getReadAt() == null) notification.setReadAt(Instant.now());
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.markAllRead(userId, Instant.now());
    }

    @Transactional(readOnly = true)
    public NotificationPreferencesRequest getPreferences(UUID userId) {
        return toRequest(preferencesRepository.findByUser_Id(userId).orElseGet(() -> defaults(userId)));
    }

    @Transactional
    public NotificationPreferencesRequest updatePreferences(UUID userId, NotificationPreferencesRequest request) {
        NotificationPreferences preferences = preferencesRepository.findByUser_Id(userId)
                .orElseGet(() -> defaults(userId));
        preferences.setMatchReminders(request.matchReminders());
        preferences.setMatchStartEnd(request.matchStartEnd());
        preferences.setGoals(request.goals());
        preferences.setScheduleChanges(request.scheduleChanges());
        preferences.setAnnouncements(request.announcements());
        preferences.setForumReplies(request.forumReplies());
        return toRequest(preferencesRepository.save(preferences));
    }

    @Transactional
    public void publishAnnouncement(Announcement announcement) {
        var championship = championatRepository.findById(announcement.getChampionship().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Championnat introuvable."));
        List<Notification> notifications = userRepository.findAll().stream()
                .filter(user -> preferencesRepository.findByUser_Id(user.getId())
                        .map(NotificationPreferences::isAnnouncements).orElse(true))
                .map(user -> notification(user, championship, announcement))
                .toList();
        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void notifyForumReply(Discussion discussion, User responder, String replyBody) {
        User recipient = discussion.getAuthor();
        if (recipient.getId().equals(responder.getId())
                || !preferencesRepository.findByUser_Id(recipient.getId())
                        .map(NotificationPreferences::isForumReplies).orElse(true)) {
            return;
        }
        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setChampionship(discussion.getChampionship());
        notification.setType(NotificationType.FORUM_REPLY);
        notification.setTitle("Nouvelle réponse dans une discussion suivie");
        notification.setMessage(replyBody.length() > 500 ? replyBody.substring(0, 500) : replyBody);
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyMatchEvent(Match match, MatchEvent event) {
        NotificationType type;
        String message;
        if (event.getType() == MatchEventType.MATCH_STARTED) {
            type = NotificationType.MATCH_STARTED;
            message = "Le match " + match.getHomeTeam().getName() + " - " + match.getAwayTeam().getName() + " a commencé.";
        } else if (event.getType() == MatchEventType.MATCH_ENDED) {
            type = NotificationType.MATCH_FINISHED;
            message = match.getHomeTeam().getName() + " " + match.getHomeScore() + " - "
                    + match.getAwayScore() + " " + match.getAwayTeam().getName();
        } else if (event.getType() == MatchEventType.GOAL || event.getType() == MatchEventType.OWN_GOAL
                || event.getType() == MatchEventType.PENALTY_GOAL) {
            type = NotificationType.GOAL;
            message = match.getHomeTeam().getName() + " " + match.getHomeScore() + " - "
                    + match.getAwayScore() + " " + match.getAwayTeam().getName();
        } else {
            return;
        }
        NotificationType notificationType = type;
        boolean startEnd = type != NotificationType.GOAL;
        String title = type == NotificationType.GOAL ? "But en direct" : type == NotificationType.MATCH_STARTED
                ? "Le match commence" : "Match terminé";
        List<Notification> notifications = userRepository.findAll().stream()
                .filter(user -> preferencesRepository.findByUser_Id(user.getId())
                        .map(preferences -> startEnd ? preferences.isMatchStartEnd() : preferences.isGoals())
                        .orElse(startEnd))
                .map(user -> {
                    Notification notification = new Notification();
                    notification.setUser(user);
                    notification.setChampionship(match.getChampionship());
                    notification.setType(notificationType);
                    notification.setTitle(title);
                    notification.setMessage(message);
                    return notification;
                }).toList();
        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void notifyScheduleChange(Match match, NotificationType type) {
        String title = switch (type) {
            case MATCH_POSTPONED -> "Match reporté";
            case MATCH_CANCELLED -> "Match annulé";
            default -> "Programme modifié";
        };
        String message = match.getHomeTeam().getName() + " - " + match.getAwayTeam().getName();
        List<Notification> notifications = userRepository.findAll().stream()
                .filter(user -> preferencesRepository.findByUser_Id(user.getId())
                        .map(NotificationPreferences::isScheduleChanges).orElse(true))
                .map(user -> {
                    Notification notification = new Notification();
                    notification.setUser(user);
                    notification.setChampionship(match.getChampionship());
                    notification.setType(type);
                    notification.setTitle(title);
                    notification.setMessage(message);
                    return notification;
                }).toList();
        notificationRepository.saveAll(notifications);
    }

    private Notification notification(
            User user, com.tikiscore_server.championat.Championat championship, Announcement announcement
    ) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setChampionship(championship);
        notification.setType(NotificationType.OFFICIAL_ANNOUNCEMENT);
        notification.setTitle(announcement.getTitle());
        notification.setMessage(announcement.getExcerpt());
        return notification;
    }

    private NotificationPreferences defaults(UUID userId) {
        NotificationPreferences preferences = new NotificationPreferences();
        preferences.setUser(userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable.")));
        return preferences;
    }

    private NotificationPreferencesRequest toRequest(NotificationPreferences preferences) {
        return new NotificationPreferencesRequest(preferences.isMatchReminders(), preferences.isMatchStartEnd(),
                preferences.isGoals(), preferences.isScheduleChanges(), preferences.isAnnouncements(),
                preferences.isForumReplies());
    }
}