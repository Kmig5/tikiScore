package com.tikiscore_server.match;

import com.tikiscore_server.Player.Player;
import com.tikiscore_server.equipe.Equipe;
import com.tikiscore_server.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "match_events",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_match_event_client_id", columnNames = {"match_id", "client_event_id"}),
                @UniqueConstraint(name = "uk_match_event_sequence", columnNames = {"match_id", "sequence_number"})
        },
        indexes = @Index(name = "ix_match_event_match_state_sequence", columnList = "match_id, state, sequence_number"))
public class MatchEvent extends com.tikiscore_server.common.Entity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "match_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_match_event_match"))
    private Match match;

    @Column(name = "client_event_id", nullable = false, length = 100)
    private String clientEventId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    private MatchEventType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", foreignKey = @ForeignKey(name = "fk_match_event_team"))
    private Equipe team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", foreignKey = @ForeignKey(name = "fk_match_event_player"))
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_player_id", foreignKey = @ForeignKey(name = "fk_match_event_related_player"))
    private Player relatedPlayer;

    @Column(name = "minute", nullable = false)
    private int minute;

    @Column(name = "added_time", nullable = false)
    private int addedTime;

    @Column(name = "sequence_number", nullable = false)
    private long sequence;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false, length = 20)
    private MatchEventState state = MatchEventState.ACTIVE;

    @Column(name = "home_score_after", nullable = false)
    private int homeScoreAfter;

    @Column(name = "away_score_after", nullable = false)
    private int awayScoreAfter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_match_event_author"))
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancellation_author_id",
            foreignKey = @ForeignKey(name = "fk_match_event_cancellation_author"))
    private User cancellationAuthor;
}