package com.tikiscore_server.match.rating;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchPlayerRatingRepository extends JpaRepository<MatchPlayerRating, UUID> {

    Optional<MatchPlayerRating> findByMatch_IdAndMatch_Championship_IdAndPlayer_IdAndUser_Id(
            UUID matchId, UUID championshipId, UUID playerId, UUID userId);

        List<MatchPlayerRating> findAllByMatch_IdAndMatch_Championship_IdAndUser_Id(
            UUID matchId, UUID championshipId, UUID userId);

    @EntityGraph(attributePaths = {"player", "user"})
    List<MatchPlayerRating> findAllByMatch_IdAndMatch_Championship_Id(UUID matchId, UUID championshipId);
}