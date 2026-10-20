package com.tikiscore_server.Player;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerRepository extends JpaRepository<Player, UUID> {

    List<Player> findAllByEquipe_IdAndActiveTrue(UUID teamId);

    List<Player> findAllByEquipe_Championship_IdAndActiveTrue(UUID championshipId);

    Optional<Player> findByIdAndActiveTrue(UUID id);

    Optional<Player> findByIdAndEquipe_Championship_IdAndActiveTrue(UUID id, UUID championshipId);

    boolean existsByJerseyNumberAndEquipe_Id(Integer jerseyNumber, UUID teamId);
}