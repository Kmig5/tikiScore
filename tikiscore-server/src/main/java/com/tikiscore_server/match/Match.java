package com.tikiscore_server.match;

import com.tikiscore_server.championat.Championat;
import com.tikiscore_server.equipe.Equipe;
import com.tikiscore_server.group.CompetitionGroup;
import com.tikiscore_server.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "matches", indexes = {
        @Index(name = "ix_matches_championship_start", columnList = "championship_id, starts_at"),
        @Index(name = "ix_matches_championship_status", columnList = "championship_id, status")
})
public class Match extends com.tikiscore_server.common.Entity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "championship_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_match_championship"))
    private Championat championship;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", foreignKey = @ForeignKey(name = "fk_match_group"))
    private CompetitionGroup group;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "home_team_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_match_home_team"))
    private Equipe homeTeam;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "away_team_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_match_away_team"))
    private Equipe awayTeam;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "venue", length = 180)
    private String venue;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private MatchStatus status = MatchStatus.SCHEDULED;

        @Enumerated(EnumType.STRING)
        @Column(name = "status_before_pause", length = 30)
        private MatchStatus statusBeforePause;

    @Column(name = "home_score", nullable = false)
    private int homeScore;

    @Column(name = "away_score", nullable = false)
    private int awayScore;

    @Column(name = "minute", nullable = false)
    private int minute;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "match_managers",
            joinColumns = @JoinColumn(name = "match_id", foreignKey = @ForeignKey(name = "fk_match_manager_match")),
            inverseJoinColumns = @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_match_manager_user")))
    private Set<User> assignedManagers = new HashSet<>();
}