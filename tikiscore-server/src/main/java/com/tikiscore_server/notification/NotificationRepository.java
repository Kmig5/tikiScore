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

    Page<Notification> findAllByUser_IdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    long countByUser_IdAndReadAtIsNull(UUID userId);

    Optional<Notification> findByIdAndUser_Id(UUID id, UUID userId);

    @Modifying
    @Query("update Notification notification set notification.readAt = :readAt "
            + "where notification.user.id = :userId and notification.readAt is null")
    int markAllRead(@Param("userId") UUID userId, @Param("readAt") java.time.Instant readAt);
}