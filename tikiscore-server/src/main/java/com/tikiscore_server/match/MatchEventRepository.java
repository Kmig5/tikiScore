package com.tikiscore_server.match;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchEventRepository extends JpaRepository<MatchEvent, UUID> {

    @EntityGraph(attributePaths = {"team", "player", "relatedPlayer"})
    List<MatchEvent> findAllByMatch_IdAndStateAndSequenceGreaterThanOrderBySequenceAsc(
            UUID matchId, MatchEventState state, long sequence);

        @EntityGraph(attributePaths = {"team", "player", "relatedPlayer"})
        List<MatchEvent> findAllByMatch_IdAndSequenceGreaterThanOrderBySequenceAsc(UUID matchId, long sequence);

    @EntityGraph(attributePaths = {"team", "player", "relatedPlayer"})
    List<MatchEvent> findAllByMatch_IdAndStateOrderBySequenceAsc(UUID matchId, MatchEventState state);

    Optional<MatchEvent> findByMatch_IdAndClientEventId(UUID matchId, String clientEventId);

    Optional<MatchEvent> findFirstByMatch_IdOrderBySequenceDesc(UUID matchId);

    @EntityGraph(attributePaths = {"match", "match.homeTeam", "match.awayTeam", "match.group", "team", "player", "relatedPlayer"})
    List<MatchEvent> findAllByMatch_Championship_IdAndStateOrderByMatch_IdAscSequenceAsc(
            UUID championshipId, MatchEventState state);

        @EntityGraph(attributePaths = {"match", "match.homeTeam", "match.awayTeam", "match.group", "team", "player", "relatedPlayer"})
        List<MatchEvent> findAllByMatch_Championship_IdAndMatch_StatusAndStateOrderByMatch_IdAscSequenceAsc(
            UUID championshipId, MatchStatus status, MatchEventState state);
}