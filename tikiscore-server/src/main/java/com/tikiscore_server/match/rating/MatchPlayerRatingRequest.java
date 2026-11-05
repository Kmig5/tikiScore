package com.tikiscore_server.match.rating;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record MatchPlayerRatingRequest(@Min(1) @Max(5) int score) {
}