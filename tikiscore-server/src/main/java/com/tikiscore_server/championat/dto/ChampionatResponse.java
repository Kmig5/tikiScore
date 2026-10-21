package com.tikiscore_server.championat.dto;

import com.tikiscore_server.championat.Championat;
import java.time.LocalDate;
import java.util.UUID;

public record ChampionatResponse(
        UUID id,
        String name,
        String edition,
        String description,
        String locality,
        LocalDate startDate,
        LocalDate endDate,
        String publicUrl,
        String format,
        String status,
        boolean forumPublic,
        int pointsForWin,
        int pointsForDraw,
        int pointsForLoss,
        String timeZone
) {
    public static ChampionatResponse from(Championat championat, String publicUrl) {
        return new ChampionatResponse(
                championat.getId(),
                championat.getName(),
                valueOrEmpty(championat.getEdition()),
                valueOrEmpty(championat.getDescription()),
                valueOrEmpty(championat.getLocalite()),
                championat.getStartDate(),
                championat.getEndDate(),
                publicUrl,
                championat.getFormat().name(),
                championat.getStatus().name(),
                championat.isForumPublic(),
                championat.getPointsForWin(),
                championat.getPointsForDraw(),
                championat.getPointsForLoss(),
                championat.getTimeZone()
        );
    }

    private static String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }
}