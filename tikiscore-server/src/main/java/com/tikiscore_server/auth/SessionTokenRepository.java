package com.tikiscore_server.auth;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionTokenRepository extends JpaRepository<SessionToken, UUID> {

    @EntityGraph(attributePaths = {"user", "user.roles"})
    Optional<SessionToken> findFirstByAccessTokenHashAndRevokedAtIsNullAndAccessExpiresAtAfter(
            String accessTokenHash,
            Instant now
    );

    @EntityGraph(attributePaths = {"user", "user.roles"})
    Optional<SessionToken> findFirstByRefreshTokenHashAndRevokedAtIsNullAndRefreshExpiresAtAfter(
            String refreshTokenHash,
            Instant now
    );

    Optional<SessionToken> findFirstByRefreshTokenHash(String refreshTokenHash);

    List<SessionToken> findAllByUser_IdAndRevokedAtIsNull(UUID userId);
}