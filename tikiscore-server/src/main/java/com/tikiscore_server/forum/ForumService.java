package com.tikiscore_server.forum;

import com.tikiscore_server.championat.Championat;
import com.tikiscore_server.championat.ChampionatRepository;
import com.tikiscore_server.championat.ChampionatService;
import com.tikiscore_server.audit.AuditService;
import com.tikiscore_server.notification.NotificationService;
import com.tikiscore_server.forum.dto.DiscussionPageResponse;
import com.tikiscore_server.forum.dto.DiscussionReplyResponse;
import com.tikiscore_server.forum.dto.DiscussionRequest;
import com.tikiscore_server.forum.dto.DiscussionResponse;
import com.tikiscore_server.forum.dto.ForumCategoryResponse;
import com.tikiscore_server.forum.dto.ForumCategoryRequest;
import com.tikiscore_server.forum.dto.ForumReportResponse;
import com.tikiscore_server.forum.dto.ReplyRequest;
import com.tikiscore_server.forum.dto.ReportRequest;
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
public class ForumService {

    private final ForumCategoryRepository categoryRepository;
    private final DiscussionRepository discussionRepository;
    private final DiscussionReplyRepository replyRepository;
    private final ForumReportRepository reportRepository;
    private final ChampionatRepository championatRepository;
    private final ChampionatService championatService;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public ForumService(
            ForumCategoryRepository categoryRepository,
            DiscussionRepository discussionRepository,
            DiscussionReplyRepository replyRepository,
            ForumReportRepository reportRepository,
            ChampionatRepository championatRepository,
            ChampionatService championatService,
            UserRepository userRepository,
            AuditService auditService,
            NotificationService notificationService
    ) {
        this.categoryRepository = categoryRepository;
        this.discussionRepository = discussionRepository;
        this.replyRepository = replyRepository;
        this.reportRepository = reportRepository;
        this.championatRepository = championatRepository;
        this.championatService = championatService;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<ForumCategoryResponse> getCategories() {
        return categoryRepository.findAllByChampionship_IdOrderByNameAsc(publicChampionshipId())
                .stream().map(ForumCategoryResponse::from).toList();
    }

    @Transactional
    public ForumCategoryResponse createCategory(ForumCategoryRequest request) {
        UUID championshipId = championatService.getConfiguredChampionatId();
        if (categoryRepository.existsByNameIgnoreCaseAndChampionship_Id(request.name().trim(), championshipId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cette catégorie existe déjà.");
        }
        ForumCategory category = new ForumCategory();
        category.setChampionship(championatRepository.findById(championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Championnat introuvable.")));
        category.setName(request.name().trim());
        return ForumCategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional(readOnly = true)
    public DiscussionPageResponse getDiscussions(int page, int size, UUID categoryId) {
        UUID championshipId = publicChampionshipId();
        PageRequest pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));
        Page<Discussion> discussions = categoryId == null
                ? discussionRepository.findAllByChampionship_IdAndHiddenFalseOrderByPinnedDescCreatedAtDesc(
                        championshipId, pageable)
                : discussionRepository.findAllByChampionship_IdAndCategory_IdAndHiddenFalseOrderByPinnedDescCreatedAtDesc(
                        championshipId, categoryId, pageable);
        return new DiscussionPageResponse(discussions.getContent().stream()
                .map(discussion -> toResponse(discussion, List.of())).toList(), discussions.getNumber(),
                discussions.getSize(), discussions.getTotalElements(), discussions.getTotalPages());
    }

    @Transactional(readOnly = true)
    public DiscussionResponse getDiscussion(UUID discussionId) {
        Discussion discussion = discussionRepository.findByIdAndChampionship_IdAndHiddenFalse(
                        discussionId, publicChampionshipId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Discussion introuvable."));
        List<DiscussionReplyResponse> replies = replyRepository
                .findAllByDiscussion_IdAndHiddenFalseOrderByCreatedAtAsc(discussionId)
                .stream().map(DiscussionReplyResponse::from).toList();
        return toResponse(discussion, replies);
    }

    @Transactional
    public DiscussionResponse createDiscussion(UUID authorId, DiscussionRequest request) {
        UUID championshipId = publicChampionshipId();
        ForumCategory category = categoryRepository.findByIdAndChampionship_Id(request.categoryId(), championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Catégorie invalide."));
        Discussion discussion = new Discussion();
        discussion.setChampionship(championatRepository.findById(championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Championnat introuvable.")));
        discussion.setCategory(category);
        discussion.setAuthor(requireUser(authorId));
        discussion.setTitle(request.title().trim());
        discussion.setBody(request.body().trim());
        return toResponse(discussionRepository.save(discussion), List.of());
    }

    @Transactional
    public DiscussionReplyResponse createReply(UUID authorId, UUID discussionId, ReplyRequest request) {
        Discussion discussion = requireVisibleDiscussion(discussionId);
        if (discussion.getStatus() == DiscussionStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cette discussion est fermée.");
        }
        DiscussionReply reply = new DiscussionReply();
        reply.setDiscussion(discussion);
        User responder = requireUser(authorId);
        reply.setAuthor(responder);
        reply.setBody(request.body().trim());
        DiscussionReply saved = replyRepository.save(reply);
        notificationService.notifyForumReply(discussion, responder, saved.getBody());
        return DiscussionReplyResponse.from(saved);
    }

    @Transactional
        public ForumReportResponse report(UUID reporterId, UUID postId, ReportRequest request) {
        UUID championshipId = publicChampionshipId();
        Discussion discussion = discussionRepository.findByIdAndChampionship_IdAndHiddenFalse(postId, championshipId)
            .orElse(null);
        DiscussionReply reply = null;
        if (discussion == null) {
            reply = replyRepository.findByIdAndDiscussion_Championship_IdAndHiddenFalse(postId, championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Publication introuvable."));
            discussion = reply.getDiscussion();
        }
        ForumReport report = new ForumReport();
        report.setDiscussion(discussion);
        report.setReply(reply);
        report.setReporter(requireUser(reporterId));
        report.setReason(request.reason().trim());
        return ForumReportResponse.from(reportRepository.save(report));
    }

    @Transactional(readOnly = true)
    public List<ForumReportResponse> getReports() {
        return reportRepository.findAllByDiscussion_Championship_IdOrderByResolvedAscCreatedAtDesc(
                championatService.getConfiguredChampionatId()).stream().map(ForumReportResponse::from).toList();
    }

    @Transactional
    public void pin(UUID discussionId, boolean pinned, UUID moderatorId) {
        Discussion discussion = requireDiscussion(discussionId);
        discussion.setPinned(pinned);
        discussion.setModeratedBy(requireUser(moderatorId));
        discussion.setModeratedAt(Instant.now());
        auditService.record(moderatorId, "FORUM_DISCUSSION_PIN_CHANGED", "Discussion", discussionId,
            "pinned=" + pinned);
    }

    @Transactional
    public void close(UUID discussionId, boolean closed, UUID moderatorId) {
        Discussion discussion = requireDiscussion(discussionId);
        discussion.setStatus(closed ? DiscussionStatus.CLOSED : DiscussionStatus.OPEN);
        discussion.setModeratedBy(requireUser(moderatorId));
        discussion.setModeratedAt(Instant.now());
        auditService.record(moderatorId, "FORUM_DISCUSSION_STATUS_CHANGED", "Discussion", discussionId,
            "closed=" + closed);
    }

    @Transactional
    public void hide(UUID discussionId, UUID replyId, UUID moderatorId) {
        User moderator = requireUser(moderatorId);
        if (replyId == null) {
            Discussion discussion = requireDiscussion(discussionId);
            discussion.setHidden(true);
            discussion.setModeratedBy(moderator);
            discussion.setModeratedAt(Instant.now());
            auditService.record(moderatorId, "FORUM_DISCUSSION_HIDDEN", "Discussion", discussionId, null);
            return;
        }
        DiscussionReply reply = replyRepository.findByIdAndDiscussion_Id(replyId, discussionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Réponse introuvable."));
        reply.setHidden(true);
        reply.setModeratedBy(moderator);
        reply.setModeratedAt(Instant.now());
        auditService.record(moderatorId, "FORUM_REPLY_HIDDEN", "DiscussionReply", replyId, null);
    }

    @Transactional
    public void resolveReport(UUID reportId, UUID moderatorId) {
        UUID championshipId = championatService.getConfiguredChampionatId();
        ForumReport report = reportRepository.findById(reportId)
                .filter(candidate -> candidate.getDiscussion().getChampionship().getId().equals(championshipId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Signalement introuvable."));
        report.setResolved(true);
        report.setModerator(requireUser(moderatorId));
        report.setResolvedAt(Instant.now());
        auditService.record(moderatorId, "FORUM_REPORT_RESOLVED", "ForumReport", reportId, null);
    }

    private UUID publicChampionshipId() {
        UUID championshipId = championatService.getPublicChampionatId();
        Championat championship = championatRepository.findById(championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Championnat introuvable."));
        if (!championship.isForumPublic()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Le forum public est désactivé.");
        }
        return championshipId;
    }

    private Discussion requireDiscussion(UUID discussionId) {
        return discussionRepository.findByIdAndChampionship_Id(discussionId, championatService.getConfiguredChampionatId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Discussion introuvable."));
    }

    private Discussion requireVisibleDiscussion(UUID discussionId) {
        return discussionRepository.findByIdAndChampionship_IdAndHiddenFalse(discussionId, publicChampionshipId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Discussion introuvable."));
    }

    private DiscussionResponse toResponse(Discussion discussion, List<DiscussionReplyResponse> replies) {
        return DiscussionResponse.from(discussion, replies);
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
}