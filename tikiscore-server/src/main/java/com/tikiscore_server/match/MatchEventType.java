package com.tikiscore_server.match;

import tools.jackson.annotation.JsonCreator;

public enum MatchEventType {
    MATCH_STARTED,
    MATCH_PAUSED,
    MATCH_RESUMED,
    HALF_TIME_STARTED,
    SECOND_HALF_STARTED,
    GOAL,
    OWN_GOAL,
    PENALTY_GOAL,
    PENALTY_MISSED,
    YELLOW_CARD,
    SECOND_YELLOW_CARD,
    RED_CARD,
    SUBSTITUTION,
    SCORE_CORRECTION,
    MATCH_ENDED,
    MATCH_POSTPONED,
    MATCH_CANCELLED;

    @JsonCreator
    public static MatchEventType fromJson(String value) {
        if (value == null) return null;
        return switch (value) {
            case "goal" -> GOAL;
            case "ownGoal" -> OWN_GOAL;
            case "penaltyGoal" -> PENALTY_GOAL;
            case "penaltyMissed" -> PENALTY_MISSED;
            case "yellowCard" -> YELLOW_CARD;
            case "secondYellowCard" -> SECOND_YELLOW_CARD;
            case "redCard" -> RED_CARD;
            case "substitution" -> SUBSTITUTION;
            case "periodStart" -> MATCH_STARTED;
            case "halftime" -> HALF_TIME_STARTED;
            case "periodResume" -> MATCH_RESUMED;
            case "fullTime" -> MATCH_ENDED;
            default -> MatchEventType.valueOf(value.toUpperCase(java.util.Locale.ROOT));
        };
    }
}