package com.tikiscore_server.notification;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findAllByUser_IdAndChampionship_IdOrderByCreatedAtDesc(UUID userId, UUID championshipId, Pageable pageable);

    long countByUser_IdAndChampionship_IdAndReadAtIsNull(UUID userId, UUID championshipId);

    Optional<Notification> findByIdAndUser_IdAndChampionship_Id(UUID id, UUID userId, UUID championshipId);

    @Modifying
    @Query("update Notification notification set notification.readAt = :readAt "
            + "where notification.user.id = :userId and notification.championship.id = :championshipId "
            + "and notification.readAt is null")
        int markAllRead(
            @Param("userId") UUID userId,
            @Param("championshipId") UUID championshipId,
            @Param("readAt") java.time.Instant readAt
        );
}