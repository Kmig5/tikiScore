package com.tikiscore_server.forum;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.tikiscore_server.audit.AuditService;
import com.tikiscore_server.championat.ChampionatRepository;
import com.tikiscore_server.championat.ChampionatService;
import com.tikiscore_server.notification.NotificationService;
import com.tikiscore_server.user.User;
import com.tikiscore_server.user.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ForumServiceTest {

    private final DiscussionRepository discussionRepository = mock(DiscussionRepository.class);
    private final ChampionatService championatService = mock(ChampionatService.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final AuditService auditService = mock(AuditService.class);
    private final ForumService service = new ForumService(
            mock(ForumCategoryRepository.class),
            discussionRepository,
            mock(DiscussionReplyRepository.class),
            mock(ForumReportRepository.class),
            mock(ChampionatRepository.class),
            championatService,
            userRepository,
            auditService,
            mock(NotificationService.class));

    @Test
    void setDiscussionHiddenSupportsRestoringWithinConfiguredChampionship() {
        UUID championshipId = UUID.randomUUID();
        UUID discussionId = UUID.randomUUID();
        UUID moderatorId = UUID.randomUUID();
        Discussion discussion = new Discussion();
        discussion.setHidden(true);
        when(championatService.getConfiguredChampionatId()).thenReturn(championshipId);
        when(discussionRepository.findByIdAndChampionship_Id(discussionId, championshipId))
                .thenReturn(Optional.of(discussion));
        when(userRepository.findById(moderatorId)).thenReturn(Optional.of(new User()));

        service.setDiscussionHidden(discussionId, false, moderatorId);

        assertTrue(!discussion.isHidden());
        verify(auditService).record(eq(moderatorId), eq("FORUM_DISCUSSION_RESTORED"), eq("Discussion"),
                eq(discussionId), eq(null));
    }
}