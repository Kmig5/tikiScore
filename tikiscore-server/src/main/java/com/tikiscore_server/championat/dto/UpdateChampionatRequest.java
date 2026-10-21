package com.tikiscore_server.championat.dto;

import com.tikiscore_server.championat.enums.CompetitionFormat;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateChampionatRequest(
        @Size(min = 1, max = 150) String name,
        @Size(min = 1, max = 180)
        @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*") String slug,
        @Size(max = 100) String edition,
        @Size(max = 1000) String description,
        @Size(max = 150) String locality,
        LocalDate startDate,
        LocalDate endDate,
        CompetitionFormat format,
        Boolean forumPublic,
        @Min(0) Integer pointsForWin,
        @Min(0) Integer pointsForDraw,
        @Min(0) Integer pointsForLoss,
        @Size(max = 60) String timeZone
) {
}