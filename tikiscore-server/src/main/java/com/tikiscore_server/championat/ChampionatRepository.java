package com.tikiscore_server.championat;

import com.tikiscore_server.championat.enums.ChampionatStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChampionatRepository extends JpaRepository<Championat, UUID> {

    @EntityGraph(attributePaths = "organisateur")
    List<Championat> findAllByStatusInOrderByStartDateAsc(List<ChampionatStatus> statuses);
    
    Optional<Championat> findBySlug(String slug);

    boolean existsBySlugIgnoreCase(String slug);
}