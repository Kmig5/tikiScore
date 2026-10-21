package com.tikiscore_server.announcement;

import com.tikiscore_server.announcement.dto.AnnouncementRequest;
import com.tikiscore_server.announcement.dto.AnnouncementResponse;
import com.tikiscore_server.audit.AuditService;
import com.tikiscore_server.championat.ChampionatRepository;
import com.tikiscore_server.championat.ChampionatService;
import com.tikiscore_server.notification.NotificationService;
import com.tikiscore_server.user.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final ChampionatService championatService;
    private final ChampionatRepository championatRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public AnnouncementService(
            AnnouncementRepository announcementRepository,
            ChampionatService championatService,
            ChampionatRepository championatRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            AuditService auditService
    ) {
        this.announcementRepository = announcementRepository;
        this.championatService = championatService;
        this.championatRepository = championatRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getPublicAnnouncements() {
        return announcementRepository.findAllByChampionship_IdAndStatusOrderByPublishedAtDesc(
                championatService.getPublicChampionatId(), AnnouncementStatus.PUBLISHED)
                .stream().map(AnnouncementResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAdminAnnouncements() {
        return announcementRepository.findAllByChampionship_IdOrderByCreatedAtDesc(
                championatService.getConfiguredChampionatId()).stream().map(AnnouncementResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AnnouncementResponse getPublicAnnouncement(UUID id) {
        return AnnouncementResponse.from(announcementRepository.findByIdAndChampionship_IdAndStatus(
                        id, championatService.getPublicChampionatId(), AnnouncementStatus.PUBLISHED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Communiqué introuvable.")));
    }

    @Transactional
    public AnnouncementResponse create(UUID authorId, AnnouncementRequest request) {
        Announcement announcement = new Announcement();
        announcement.setChampionship(championatRepository.findById(championatService.getConfiguredChampionatId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Championnat introuvable.")));
        announcement.setAuthor(userRepository.findById(authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED)));
        apply(announcement, request);
        return AnnouncementResponse.from(announcementRepository.save(announcement));
    }

    @Transactional
    public AnnouncementResponse update(UUID id, AnnouncementRequest request) {
        Announcement announcement = requireAdminAnnouncement(id);
        if (announcement.getStatus() != AnnouncementStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seul un brouillon peut être modifié.");
        }
        apply(announcement, request);
        return AnnouncementResponse.from(announcementRepository.save(announcement));
    }

    @Transactional
    public AnnouncementResponse publish(UUID id, UUID actorId) {
        Announcement announcement = requireAdminAnnouncement(id);
        if (announcement.getStatus() != AnnouncementStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce communiqué ne peut pas être publié.");
        }
        announcement.setStatus(AnnouncementStatus.PUBLISHED);
        announcement.setPublishedAt(Instant.now());
        Announcement published = announcementRepository.save(announcement);
        notificationService.publishAnnouncement(published);
        auditService.record(actorId, "ANNOUNCEMENT_PUBLISHED", "Announcement", published.getId(),
            "priority=" + published.getPriority());
        return AnnouncementResponse.from(published);
    }

    @Transactional
    public AnnouncementResponse archive(UUID id, UUID actorId) {
        Announcement announcement = requireAdminAnnouncement(id);
        if (announcement.getStatus() != AnnouncementStatus.PUBLISHED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seul un communiqué publié peut être archivé.");
        }
        announcement.setStatus(AnnouncementStatus.ARCHIVED);
        auditService.record(actorId, "ANNOUNCEMENT_ARCHIVED", "Announcement", announcement.getId(), null);
        return AnnouncementResponse.from(announcementRepository.save(announcement));
    }

    private Announcement requireAdminAnnouncement(UUID id) {
        return announcementRepository.findByIdAndChampionship_Id(id, championatService.getConfiguredChampionatId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Communiqué introuvable."));
    }

    private void apply(Announcement announcement, AnnouncementRequest request) {
        announcement.setTitle(request.title().trim());
        announcement.setExcerpt(request.excerpt().trim());
        announcement.setBody(request.body().trim());
        announcement.setPriority(request.priority());
        announcement.setShowOnHome(request.showOnHome());
    }
}