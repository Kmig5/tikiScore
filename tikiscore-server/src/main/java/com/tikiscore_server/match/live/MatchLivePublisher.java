package com.tikiscore_server.match.live;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class MatchLivePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public MatchLivePublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publish(MatchLiveUpdate update) {
        messagingTemplate.convertAndSend("/topic/matches/" + update.matchId(), update);
        messagingTemplate.convertAndSend("/topic/competition/live", update);
    }
}