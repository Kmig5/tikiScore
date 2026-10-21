package com.tikiscore_server.forum;

import com.tikiscore_server.forum.dto.DiscussionPageResponse;
import com.tikiscore_server.forum.dto.DiscussionRequest;
import com.tikiscore_server.forum.dto.DiscussionResponse;
import com.tikiscore_server.forum.dto.ForumCategoryResponse;
import com.tikiscore_server.forum.dto.ForumCategoryRequest;
import com.tikiscore_server.forum.dto.ForumReportResponse;
import com.tikiscore_server.forum.dto.ReplyRequest;
import com.tikiscore_server.forum.dto.ReportRequest;
import com.tikiscore_server.forum.dto.DiscussionReplyResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ForumController {

    private final ForumService forumService;

    public ForumController(ForumService forumService) {
        this.forumService = forumService;
    }

    @GetMapping("/public/forum/categories")
    public List<ForumCategoryResponse> getCategories() {
        return forumService.getCategories();
    }

    @PostMapping("/admin/forum/categories")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public ResponseEntity<ForumCategoryResponse> createCategory(@Valid @RequestBody ForumCategoryRequest request) {
        ForumCategoryResponse created = forumService.createCategory(request);
        return ResponseEntity.created(URI.create("/api/public/forum/categories")).body(created);
    }

    @GetMapping("/public/forum/discussions")
    public DiscussionPageResponse getDiscussions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID categoryId
    ) {
        return forumService.getDiscussions(page, size, categoryId);
    }

    @GetMapping("/public/forum/discussions/{discussionId}")
    public DiscussionResponse getDiscussion(@PathVariable UUID discussionId) {
        return forumService.getDiscussion(discussionId);
    }

    @PostMapping("/forum/discussions")
    @PreAuthorize("hasAuthority('PERM_FORUM_PARTICIPATE')")
    public ResponseEntity<DiscussionResponse> createDiscussion(
            Authentication authentication,
            @Valid @RequestBody DiscussionRequest request
    ) {
        DiscussionResponse created = forumService.createDiscussion(userId(authentication), request);
        return ResponseEntity.created(URI.create("/api/public/forum/discussions/" + created.id())).body(created);
    }

    @PostMapping("/forum/discussions/{discussionId}/replies")
    @PreAuthorize("hasAuthority('PERM_FORUM_PARTICIPATE')")
    public ResponseEntity<DiscussionReplyResponse> reply(
            Authentication authentication,
            @PathVariable UUID discussionId,
            @Valid @RequestBody ReplyRequest request
    ) {
        DiscussionReplyResponse created = forumService.createReply(userId(authentication), discussionId, request);
        return ResponseEntity.created(URI.create("/api/public/forum/discussions/" + discussionId)).body(created);
    }

    @PostMapping("/forum/posts/{postId}/reports")
    @PreAuthorize("hasAuthority('PERM_FORUM_REPORT')")
    public ResponseEntity<ForumReportResponse> report(
            Authentication authentication,
            @PathVariable UUID postId,
            @Valid @RequestBody ReportRequest request
    ) {
        ForumReportResponse created = forumService.report(userId(authentication), postId, request);
        return ResponseEntity.created(URI.create("/api/moderation/reports/" + created.id())).body(created);
    }

    @GetMapping("/moderation/reports")
    @PreAuthorize("hasAuthority('PERM_FORUM_MODERATE')")
    public List<ForumReportResponse> getReports() {
        return forumService.getReports();
    }

    @PostMapping("/moderation/discussions/{discussionId}/pin")
    @PreAuthorize("hasAuthority('PERM_FORUM_MODERATE')")
    public ResponseEntity<Void> pin(
            Authentication authentication,
            @PathVariable UUID discussionId,
            @RequestParam(defaultValue = "true") boolean pinned
    ) {
        forumService.pin(discussionId, pinned, userId(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/moderation/discussions/{discussionId}/close")
    @PreAuthorize("hasAuthority('PERM_FORUM_MODERATE')")
    public ResponseEntity<Void> close(
            Authentication authentication,
            @PathVariable UUID discussionId,
            @RequestParam(defaultValue = "true") boolean closed
    ) {
        forumService.close(discussionId, closed, userId(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/moderation/posts/{postId}/hide")
    @PreAuthorize("hasAuthority('PERM_FORUM_MODERATE')")
    public ResponseEntity<Void> hide(
            Authentication authentication,
            @PathVariable UUID postId,
            @RequestParam UUID discussionId
    ) {
        forumService.hide(discussionId, postId, userId(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/moderation/reports/{reportId}/resolve")
    @PreAuthorize("hasAuthority('PERM_FORUM_MODERATE')")
    public ResponseEntity<Void> resolveReport(Authentication authentication, @PathVariable UUID reportId) {
        forumService.resolveReport(reportId, userId(authentication));
        return ResponseEntity.noContent().build();
    }

    private UUID userId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }
}