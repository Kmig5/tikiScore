package com.tikiscore_server.statistic;

import com.tikiscore_server.standing.StandingResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class StatisticsController {

    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/standings")
    public List<StandingResponse> getStandings(@RequestParam(required = false) UUID groupId) {
        return statisticsService.getStandings(groupId);
    }

    @GetMapping("/groups/{groupId}/standings")
    public List<StandingResponse> getGroupStandings(@PathVariable UUID groupId) {
        return statisticsService.getStandings(groupId);
    }

    @GetMapping("/statistics/top-scorers")
    public List<PlayerStatisticResponse> getTopScorers() {
        return statisticsService.getTopScorers();
    }

    @GetMapping("/statistics/top-assists")
    public List<PlayerStatisticResponse> getTopAssists() {
        return statisticsService.getTopAssists();
    }

    @GetMapping("/statistics/cards")
    public List<PlayerStatisticResponse> getCards() {
        return statisticsService.getCards();
    }

    @GetMapping("/statistics/overview")
    public StatisticsOverviewResponse getOverview() {
        return statisticsService.getOverview();
    }
}