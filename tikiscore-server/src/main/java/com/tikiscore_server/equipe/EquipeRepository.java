package com.tikiscore_server.equipe;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EquipeRepository extends JpaRepository<Equipe, UUID> {

    List<Equipe> findAllByChampionship_IdAndActiveTrue(UUID championshipId);

    List<Equipe> findAllByChampionship_IdAndGroup_IdAndActiveTrue(UUID championshipId, UUID groupId);

    Optional<Equipe> findByIdAndActiveTrue(UUID id);

    Optional<Equipe> findByIdAndChampionship_IdAndActiveTrue(UUID id, UUID championshipId);

    boolean existsByNameIgnoreCaseAndChampionship_Id(String name, UUID championshipId);
}