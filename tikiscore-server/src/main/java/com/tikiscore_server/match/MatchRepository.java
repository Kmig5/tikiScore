package com.tikiscore_server.match;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MatchRepository extends JpaRepository<Match, UUID> {

    @EntityGraph(attributePaths = {"homeTeam", "awayTeam", "group"})
    List<Match> findAllByChampionship_IdOrderByStartsAtAsc(UUID championshipId);

    @EntityGraph(attributePaths = {"homeTeam", "awayTeam", "group"})
    List<Match> findAllByChampionship_IdAndStatusInOrderByStartsAtAsc(UUID championshipId, List<MatchStatus> statuses);

    @EntityGraph(attributePaths = {"homeTeam", "awayTeam", "group", "assignedManagers"})
    Optional<Match> findByIdAndChampionship_Id(UUID id, UUID championshipId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from Match m where m.id = :matchId and m.championship.id = :championshipId")
    Optional<Match> findForUpdate(@Param("matchId") UUID matchId, @Param("championshipId") UUID championshipId);

    @EntityGraph(attributePaths = {"homeTeam", "awayTeam", "group", "assignedManagers"})
    List<Match> findAllByAssignedManagers_IdAndChampionship_IdOrderByStartsAtAsc(UUID managerId, UUID championshipId);
}