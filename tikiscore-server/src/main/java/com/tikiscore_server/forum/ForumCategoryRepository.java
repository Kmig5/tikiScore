package com.tikiscore_server.forum;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ForumCategoryRepository extends JpaRepository<ForumCategory, UUID> {

    List<ForumCategory> findAllByChampionship_IdOrderByNameAsc(UUID championshipId);

    Optional<ForumCategory> findByIdAndChampionship_Id(UUID id, UUID championshipId);

    boolean existsByNameIgnoreCaseAndChampionship_Id(String name, UUID championshipId);
}