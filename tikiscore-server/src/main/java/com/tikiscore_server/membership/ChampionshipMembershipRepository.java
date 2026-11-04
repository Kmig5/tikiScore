package com.tikiscore_server.membership;

import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChampionshipMembershipRepository extends JpaRepository<ChampionshipMembership, UUID> {

    @EntityGraph(attributePaths = "roles")
    Optional<ChampionshipMembership> findByUser_IdAndChampionship_Id(UUID userId, UUID championshipId);

    @EntityGraph(attributePaths = {"roles", "championship"})
    List<ChampionshipMembership> findAllByUser_Id(UUID userId);

    @EntityGraph(attributePaths = {"roles", "user"})
    List<ChampionshipMembership> findAllByChampionship_Id(UUID championshipId);
}