package com.tikiscore_server.forum;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ForumReportRepository extends JpaRepository<ForumReport, UUID> {

    @EntityGraph(attributePaths = {"discussion", "reply", "reporter"})
    List<ForumReport> findAllByDiscussion_Championship_IdOrderByResolvedAscCreatedAtDesc(UUID championshipId);
}