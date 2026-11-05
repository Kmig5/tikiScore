package com.tikiscore_server.match.rating;

import com.tikiscore_server.Player.Player;
import com.tikiscore_server.match.Match;
import com.tikiscore_server.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Index;
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
        name = "match_player_ratings",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_match_player_rating_voter",
                columnNames = {"match_id", "player_id", "user_id"}
        ),
        indexes = {
                @Index(name = "ix_match_player_rating_match", columnList = "match_id"),
                @Index(name = "ix_match_player_rating_voter", columnList = "match_id, user_id")
        }
)
public class MatchPlayerRating extends com.tikiscore_server.common.Entity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "match_id", nullable = false, foreignKey = @ForeignKey(name = "fk_match_player_rating_match"))
    private Match match;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player_id", nullable = false, foreignKey = @ForeignKey(name = "fk_match_player_rating_player"))
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_match_player_rating_user"))
    private User user;

    @Column(name = "score", nullable = false)
    private int score;
}