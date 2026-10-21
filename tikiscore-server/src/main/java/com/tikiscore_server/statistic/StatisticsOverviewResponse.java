package com.tikiscore_server.statistic;

public record StatisticsOverviewResponse(long matchesPlayed, long goalsScored, long teamsCount, long playersCount) {
}