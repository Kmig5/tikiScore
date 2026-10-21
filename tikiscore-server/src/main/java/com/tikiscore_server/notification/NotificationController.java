package com.tikiscore_server.notification;

import com.tikiscore_server.notification.dto.NotificationPageResponse;
import com.tikiscore_server.notification.dto.NotificationPreferencesRequest;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasAuthority('PERM_NOTIFICATIONS_MANAGE')")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/notifications")
    public NotificationPageResponse getNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return notificationService.getNotifications(userId(authentication), page, size);
    }

    @GetMapping("/notifications/unread-count")
    public Map<String, Long> getUnreadCount(Authentication authentication) {
        return Map.of("unreadCount", notificationService.getUnreadCount(userId(authentication)));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<Void> markRead(Authentication authentication, @PathVariable UUID id) {
        notificationService.markRead(userId(authentication), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/notifications/read-all")
    public ResponseEntity<Void> markAllRead(Authentication authentication) {
        notificationService.markAllRead(userId(authentication));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/me/notification-preferences")
    public NotificationPreferencesRequest getPreferences(Authentication authentication) {
        return notificationService.getPreferences(userId(authentication));
    }

    @PatchMapping("/users/me/notification-preferences")
    public NotificationPreferencesRequest updatePreferences(
            Authentication authentication,
            @Valid @RequestBody NotificationPreferencesRequest request
    ) {
        return notificationService.updatePreferences(userId(authentication), request);
    }

    private UUID userId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }
}