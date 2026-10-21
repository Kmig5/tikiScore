package com.tikiscore_server.match;

public enum MatchStatus {
    SCHEDULED,
    LIVE_FIRST_HALF,
    HALF_TIME,
    LIVE_SECOND_HALF,
    PAUSED,
    FINISHED,
    POSTPONED,
    CANCELLED,
    ABANDONED
}