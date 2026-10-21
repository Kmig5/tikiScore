package com.tikiscore_server.forum;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscussionRepository extends JpaRepository<Discussion, UUID> {

    @EntityGraph(attributePaths = {"category", "author"})
    Page<Discussion> findAllByChampionship_IdAndHiddenFalseOrderByPinnedDescCreatedAtDesc(
            UUID championshipId, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    Page<Discussion> findAllByChampionship_IdAndCategory_IdAndHiddenFalseOrderByPinnedDescCreatedAtDesc(
            UUID championshipId, UUID categoryId, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    Optional<Discussion> findByIdAndChampionship_IdAndHiddenFalse(UUID id, UUID championshipId);

    Optional<Discussion> findByIdAndChampionship_Id(UUID id, UUID championshipId);
}