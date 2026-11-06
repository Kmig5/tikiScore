package com.tikiscore_server.match.live;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.tikiscore_server.match.MatchService;
import com.tikiscore_server.match.dto.MatchResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.annotation.Scheduled;

@ExtendWith(MockitoExtension.class)
class MatchLiveSnapshotSchedulerTest {

    @Mock
    private MatchService matchService;

    @Mock
    private MatchLivePublisher publisher;

    @InjectMocks
    private MatchLiveSnapshotScheduler scheduler;

    @Test
    void publishesCompactSnapshotsForLiveMatches() {
        UUID matchId = UUID.randomUUID();
        MatchResponse liveMatch = new MatchResponse(matchId, null, UUID.randomUUID(), "Home", UUID.randomUUID(),
                "Away", Instant.parse("2026-11-06T10:00:00Z"), "Stadium", "live", 2, 1, 34, 7);
        when(matchService.getMatchesForLiveSnapshot(org.mockito.ArgumentMatchers.any(Instant.class)))
            .thenReturn(List.of(liveMatch));

        scheduler.publishLiveSnapshots();

        ArgumentCaptor<MatchLiveUpdate> snapshotCaptor = ArgumentCaptor.forClass(MatchLiveUpdate.class);
        verify(publisher).publish(snapshotCaptor.capture());
        MatchLiveUpdate snapshot = snapshotCaptor.getValue();
        assertEquals("SCORE_SNAPSHOT", snapshot.type());
        assertEquals(matchId, snapshot.matchId());
        assertEquals(2, snapshot.homeScore());
        assertEquals(1, snapshot.awayScore());
        assertEquals(34, snapshot.minute());
        assertEquals(7, snapshot.version());
    }

    @Test
    void publishesEveryFiveMinutesAfterAnInitialDelay() throws NoSuchMethodException {
        Scheduled schedule = MatchLiveSnapshotScheduler.class
                .getMethod("publishLiveSnapshots")
                .getAnnotation(Scheduled.class);

        assertEquals(300_000, schedule.fixedRate());
        assertEquals(300_000, schedule.initialDelay());
    }
}