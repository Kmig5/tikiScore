package com.tikiscore_server.notification;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationPreferencesRepository extends JpaRepository<NotificationPreferences, UUID> {

    Optional<NotificationPreferences> findByUser_Id(UUID userId);
}