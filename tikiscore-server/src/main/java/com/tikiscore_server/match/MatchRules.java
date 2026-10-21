package com.tikiscore_server.match;

public final class MatchRules {

    private MatchRules() {
    }

    public static boolean canTransition(MatchStatus current, MatchStatus previousPeriod, MatchStatus target) {
        return switch (target) {
            case LIVE_FIRST_HALF -> current == MatchStatus.SCHEDULED
                    || (current == MatchStatus.PAUSED && previousPeriod == MatchStatus.LIVE_FIRST_HALF);
            case HALF_TIME -> current == MatchStatus.LIVE_FIRST_HALF;
            case LIVE_SECOND_HALF -> current == MatchStatus.HALF_TIME
                    || (current == MatchStatus.PAUSED && previousPeriod == MatchStatus.LIVE_SECOND_HALF);
            case PAUSED -> current == MatchStatus.LIVE_FIRST_HALF || current == MatchStatus.LIVE_SECOND_HALF;
            case FINISHED -> current == MatchStatus.LIVE_SECOND_HALF
                    || (current == MatchStatus.PAUSED && previousPeriod == MatchStatus.LIVE_SECOND_HALF);
            default -> false;
        };
    }

    public static MatchStatus resumeStatus(MatchStatus current, MatchStatus previousPeriod) {
        if (current == MatchStatus.HALF_TIME || previousPeriod == MatchStatus.LIVE_SECOND_HALF) {
            return MatchStatus.LIVE_SECOND_HALF;
        }
        if (current == MatchStatus.PAUSED && previousPeriod == MatchStatus.LIVE_FIRST_HALF) {
            return MatchStatus.LIVE_FIRST_HALF;
        }
        throw new IllegalStateException("Only a half-time or paused match can resume.");
    }
}