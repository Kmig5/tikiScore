
package com.tikiscore_server.championat;

/**
 *
 * @author Miguel
 */

import com.tikiscore_server.championat.enums.CompetitionFormat;
import com.tikiscore_server.championat.enums.ChampionatStatus;
import com.tikiscore_server.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
    name = "championships",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_championships_slug",
            columnNames = "slug"
        )
    }
)
public class Championat extends com.tikiscore_server.common.Entity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "slug", nullable = false, length = 180)
    private String slug;

    @Column(name = "edition", length = 100)
    private String edition;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "localite", length = 150)
    private String localite;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "format", nullable = false, length = 40)
    private CompetitionFormat format;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private ChampionatStatus status = ChampionatStatus.BROUILLON;

    @Column(name = "points_for_win", nullable = false)
    private int pointsForWin = 3;

    @Column(name = "points_for_draw", nullable = false)
    private int pointsForDraw = 1;

    @Column(name = "points_for_loss", nullable = false)
    private int pointsForLoss = 0;

    @Column(name = "time_zone", nullable = false, length = 60)
    private String timeZone = "UTC";

    @Column(name = "forum_public", nullable = false)
    private boolean forumPublic = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "organizer_id",
        nullable = false,
        foreignKey = @jakarta.persistence.ForeignKey(
            name = "fk_championship_organizer"
        )
    )
    private User organisateur;

}
