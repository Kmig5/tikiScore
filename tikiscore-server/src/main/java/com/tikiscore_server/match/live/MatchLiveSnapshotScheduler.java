package com.tikiscore_server.match.live;

import com.tikiscore_server.match.MatchService;
import java.time.Instant;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MatchLiveSnapshotScheduler {

    private final MatchService matchService;
    private final MatchLivePublisher publisher;

    public MatchLiveSnapshotScheduler(MatchService matchService, MatchLivePublisher publisher) {
        this.matchService = matchService;
        this.publisher = publisher;
    }

    @Scheduled(fixedRate = 300_000, initialDelay = 300_000)
    public void publishLiveSnapshots() {
        Instant serverTime = Instant.now();
        matchService.getMatchesForLiveSnapshot(serverTime.minusSeconds(300)).stream()
                .map(match -> MatchLiveUpdate.from(match, serverTime))
                .forEach(publisher::publish);
    }
}