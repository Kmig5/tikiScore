package com.tikiscore_server.match;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MatchRulesTest {

    @Test
    void onlyAllowsLegalMatchTransitions() {
        assertTrue(MatchRules.canTransition(MatchStatus.SCHEDULED, null, MatchStatus.LIVE_FIRST_HALF));
        assertTrue(MatchRules.canTransition(MatchStatus.LIVE_FIRST_HALF, null, MatchStatus.HALF_TIME));
        assertTrue(MatchRules.canTransition(MatchStatus.HALF_TIME, null, MatchStatus.LIVE_SECOND_HALF));
        assertTrue(MatchRules.canTransition(MatchStatus.LIVE_SECOND_HALF, null, MatchStatus.FINISHED));
        assertFalse(MatchRules.canTransition(MatchStatus.SCHEDULED, null, MatchStatus.FINISHED));
        assertFalse(MatchRules.canTransition(MatchStatus.FINISHED, null, MatchStatus.LIVE_FIRST_HALF));
    }

    @Test
    void resumesThePeriodRecordedBeforePause() {
        assertEquals(MatchStatus.LIVE_FIRST_HALF,
                MatchRules.resumeStatus(MatchStatus.PAUSED, MatchStatus.LIVE_FIRST_HALF));
        assertEquals(MatchStatus.LIVE_SECOND_HALF,
                MatchRules.resumeStatus(MatchStatus.PAUSED, MatchStatus.LIVE_SECOND_HALF));
        assertEquals(MatchStatus.LIVE_SECOND_HALF,
                MatchRules.resumeStatus(MatchStatus.HALF_TIME, null));
    }
}