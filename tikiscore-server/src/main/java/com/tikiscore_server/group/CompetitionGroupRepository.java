package com.tikiscore_server.group;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompetitionGroupRepository extends JpaRepository<CompetitionGroup, UUID> {

    List<CompetitionGroup> findAllByChampionship_Id(UUID championshipId);

    Optional<CompetitionGroup> findByIdAndChampionship_Id(UUID id, UUID championshipId);

    boolean existsByNameIgnoreCaseAndChampionship_Id(String name, UUID championshipId);
}