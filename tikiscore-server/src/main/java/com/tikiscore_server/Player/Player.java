
package com.tikiscore_server.Player;

/**
 *
 * @author Miguel
 */

import com.tikiscore_server.Player.enums.AgeCategorie;
import com.tikiscore_server.Player.enums.Position;
import com.tikiscore_server.equipe.Equipe;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
    name = "players",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_player_jersey_team",
            columnNames = {"jersey_number", "team_id"}
        )
    }
)
public class Player extends com.tikiscore_server.common.Entity {

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Column(name = "jersey_number", nullable = false)
    private Integer jerseyNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "position", nullable = false, length = 30)
    private Position position;

    @Enumerated(EnumType.STRING)
    @Column(name = "age_category", length = 20)
    private AgeCategorie ageCategory;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "photo_publication_allowed", nullable = false)
    private boolean photoPublicationAllowed = false;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "team_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_player_team")
    )
    private Equipe equipe;

}
