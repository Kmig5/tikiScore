package com.tikiscore_server.announcement;

import com.tikiscore_server.announcement.dto.AnnouncementRequest;
import com.tikiscore_server.announcement.dto.AnnouncementResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    public AnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @GetMapping("/public/announcements")
    public List<AnnouncementResponse> getPublicAnnouncements() {
        return announcementService.getPublicAnnouncements();
    }

    @GetMapping("/public/announcements/{id}")
    public AnnouncementResponse getPublicAnnouncement(@PathVariable UUID id) {
        return announcementService.getPublicAnnouncement(id);
    }

    @GetMapping("/admin/announcements")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public List<AnnouncementResponse> getAdminAnnouncements() {
        return announcementService.getAdminAnnouncements();
    }

    @PostMapping("/admin/announcements")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public ResponseEntity<AnnouncementResponse> create(
            Authentication authentication,
            @Valid @RequestBody AnnouncementRequest request
    ) {
        AnnouncementResponse created = announcementService.create((UUID) authentication.getPrincipal(), request);
        return ResponseEntity.created(URI.create("/api/admin/announcements/" + created.id())).body(created);
    }

    @PatchMapping("/admin/announcements/{id}")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public AnnouncementResponse update(@PathVariable UUID id, @Valid @RequestBody AnnouncementRequest request) {
        return announcementService.update(id, request);
    }

    @PostMapping("/admin/announcements/{id}/publish")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public AnnouncementResponse publish(Authentication authentication, @PathVariable UUID id) {
        return announcementService.publish(id, (UUID) authentication.getPrincipal());
    }

    @PostMapping("/admin/announcements/{id}/archive")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public AnnouncementResponse archive(Authentication authentication, @PathVariable UUID id) {
        return announcementService.archive(id, (UUID) authentication.getPrincipal());
    }
}