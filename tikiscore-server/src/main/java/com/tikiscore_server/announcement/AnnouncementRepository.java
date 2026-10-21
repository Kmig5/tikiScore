package com.tikiscore_server.announcement;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {

    @EntityGraph(attributePaths = "author")
    List<Announcement> findAllByChampionship_IdAndStatusOrderByPublishedAtDesc(
            UUID championshipId, AnnouncementStatus status);

    List<Announcement> findAllByChampionship_IdOrderByCreatedAtDesc(UUID championshipId);

    @EntityGraph(attributePaths = "author")
    Optional<Announcement> findByIdAndChampionship_IdAndStatus(UUID id, UUID championshipId, AnnouncementStatus status);

    Optional<Announcement> findByIdAndChampionship_Id(UUID id, UUID championshipId);
}