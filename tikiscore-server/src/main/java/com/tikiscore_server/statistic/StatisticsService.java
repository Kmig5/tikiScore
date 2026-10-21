package com.tikiscore_server.statistic;

import com.tikiscore_server.Player.PlayerRepository;
import com.tikiscore_server.championat.ChampionatRepository;
import com.tikiscore_server.championat.ChampionatService;
import com.tikiscore_server.equipe.Equipe;
import com.tikiscore_server.equipe.EquipeRepository;
import com.tikiscore_server.group.CompetitionGroup;
import com.tikiscore_server.group.CompetitionGroupRepository;
import com.tikiscore_server.match.Match;
import com.tikiscore_server.match.MatchEvent;
import com.tikiscore_server.match.MatchEventRepository;
import com.tikiscore_server.match.MatchEventState;
import com.tikiscore_server.match.MatchEventType;
import com.tikiscore_server.match.MatchRepository;
import com.tikiscore_server.match.MatchStatus;
import com.tikiscore_server.standing.StandingResponse;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class StatisticsService {

    private final ChampionatService championatService;
    private final ChampionatRepository championatRepository;
    private final CompetitionGroupRepository groupRepository;
    private final EquipeRepository equipeRepository;
    private final MatchRepository matchRepository;
    private final MatchEventRepository eventRepository;
    private final PlayerRepository playerRepository;

    public StatisticsService(
            ChampionatService championatService,
            ChampionatRepository championatRepository,
            CompetitionGroupRepository groupRepository,
            EquipeRepository equipeRepository,
            MatchRepository matchRepository,
            MatchEventRepository eventRepository,
            PlayerRepository playerRepository
    ) {
        this.championatService = championatService;
        this.championatRepository = championatRepository;
        this.groupRepository = groupRepository;
        this.equipeRepository = equipeRepository;
        this.matchRepository = matchRepository;
        this.eventRepository = eventRepository;
        this.playerRepository = playerRepository;
    }

    public List<StandingResponse> getStandings(UUID requestedGroupId) {
        UUID championshipId = championatService.getPublicChampionatId();
        var championship = championatRepository.findById(championshipId).orElseThrow();
        List<CompetitionGroup> groups = requestedGroupId == null
                ? groupRepository.findAllByChampionship_IdOrderByNameAsc(championshipId)
                : groupRepository.findByIdAndChampionship_Id(requestedGroupId, championshipId).stream().toList();
        if (requestedGroupId != null && groups.isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND, "Poule introuvable.");
        }
        List<Match> completedMatches = matchRepository.findAllByChampionship_IdAndStatusInOrderByStartsAtAsc(
                championshipId, List.of(MatchStatus.FINISHED));
        List<StandingResponse> result = new ArrayList<>();
        for (CompetitionGroup group : groups) {
            Map<UUID, MutableStanding> standings = new HashMap<>();
            for (Equipe team : equipeRepository.findAllByChampionship_IdAndGroup_IdAndActiveTrue(
                    championshipId, group.getId())) {
                standings.put(team.getId(), new MutableStanding(team));
            }
            for (Match match : completedMatches) {
                if (match.getGroup() == null || !match.getGroup().getId().equals(group.getId())) continue;
                MutableStanding home = standings.get(match.getHomeTeam().getId());
                MutableStanding away = standings.get(match.getAwayTeam().getId());
                if (home == null || away == null) continue;
                home.played++;
                away.played++;
                home.goalsFor += match.getHomeScore();
                home.goalsAgainst += match.getAwayScore();
                away.goalsFor += match.getAwayScore();
                away.goalsAgainst += match.getHomeScore();
                if (match.getHomeScore() > match.getAwayScore()) {
                    home.wins++;
                    home.points += championship.getPointsForWin();
                    away.losses++;
                    away.points += championship.getPointsForLoss();
                } else if (match.getHomeScore() < match.getAwayScore()) {
                    away.wins++;
                    away.points += championship.getPointsForWin();
                    home.losses++;
                    home.points += championship.getPointsForLoss();
                } else {
                    home.draws++;
                    away.draws++;
                    home.points += championship.getPointsForDraw();
                    away.points += championship.getPointsForDraw();
                }
            }
            List<MutableStanding> sorted = standings.values().stream()
                    .sorted(Comparator.comparingInt((MutableStanding standing) -> standing.points).reversed()
                            .thenComparing(Comparator.comparingInt(MutableStanding::goalDifference).reversed())
                            .thenComparing(Comparator.comparingInt((MutableStanding standing) -> standing.goalsFor).reversed())
                            .thenComparing(standing -> standing.team.getName(), String.CASE_INSENSITIVE_ORDER))
                    .toList();
            for (int index = 0; index < sorted.size(); index++) {
                MutableStanding standing = sorted.get(index);
                result.add(new StandingResponse(index + 1, standing.team.getId(), standing.team.getName(),
                        group.getId(), standing.played, standing.wins, standing.draws, standing.losses,
                        standing.goalsFor, standing.goalsAgainst, standing.goalDifference(), standing.points));
            }
        }
        return result;
    }

    public List<PlayerStatisticResponse> getTopScorers() {
        return getPlayerStatistics().stream().filter(stat -> stat.goals() > 0)
                .sorted(Comparator.comparingLong(PlayerStatisticResponse::goals).reversed()
                        .thenComparing(PlayerStatisticResponse::playerName, String.CASE_INSENSITIVE_ORDER)).toList();
    }

    public List<PlayerStatisticResponse> getTopAssists() {
        return getPlayerStatistics().stream().filter(stat -> stat.assists() > 0)
                .sorted(Comparator.comparingLong(PlayerStatisticResponse::assists).reversed()
                        .thenComparing(PlayerStatisticResponse::playerName, String.CASE_INSENSITIVE_ORDER)).toList();
    }

    public List<PlayerStatisticResponse> getCards() {
        return getPlayerStatistics().stream().filter(stat -> stat.yellowCards() > 0 || stat.redCards() > 0)
                .sorted(Comparator.comparingLong(PlayerStatisticResponse::redCards).reversed()
                        .thenComparing(Comparator.comparingLong(PlayerStatisticResponse::yellowCards).reversed())
                        .thenComparing(PlayerStatisticResponse::playerName, String.CASE_INSENSITIVE_ORDER)).toList();
    }

    public StatisticsOverviewResponse getOverview() {
        UUID championshipId = championatService.getPublicChampionatId();
        long played = matchRepository.findAllByChampionship_IdAndStatusInOrderByStartsAtAsc(
                championshipId, List.of(MatchStatus.FINISHED)).size();
        long goals = matchRepository.findAllByChampionship_IdAndStatusInOrderByStartsAtAsc(
            championshipId, List.of(MatchStatus.FINISHED)).stream()
            .mapToLong(match -> match.getHomeScore() + match.getAwayScore()).sum();
        long teams = equipeRepository.findAllByChampionship_IdAndActiveTrue(championshipId).size();
        long players = playerRepository.findAllByEquipe_Championship_IdAndActiveTrue(championshipId).size();
        return new StatisticsOverviewResponse(played, goals, teams, players);
    }

    private List<PlayerStatisticResponse> getPlayerStatistics() {
        UUID championshipId = championatService.getPublicChampionatId();
        Map<UUID, MutablePlayerStats> stats = new HashMap<>();
        for (MatchEvent event : eventRepository.findAllByMatch_Championship_IdAndMatch_StatusAndStateOrderByMatch_IdAscSequenceAsc(
            championshipId, MatchStatus.FINISHED, MatchEventState.ACTIVE)) {
            if (event.getPlayer() == null) continue;
            MutablePlayerStats playerStats = stats.computeIfAbsent(event.getPlayer().getId(),
                    ignored -> new MutablePlayerStats(event));
            if (event.getType() == MatchEventType.GOAL || event.getType() == MatchEventType.PENALTY_GOAL) {
                playerStats.goals++;
            }
            if (event.getRelatedPlayer() != null && (event.getType() == MatchEventType.GOAL
                    || event.getType() == MatchEventType.PENALTY_GOAL)) {
                stats.computeIfAbsent(event.getRelatedPlayer().getId(),
                        ignored -> new MutablePlayerStats(event.getRelatedPlayer())).assists++;
            }
            if (event.getType() == MatchEventType.YELLOW_CARD) {
                playerStats.yellowCards++;
            } else if (event.getType() == MatchEventType.SECOND_YELLOW_CARD) {
                playerStats.yellowCards += 2;
            }
            if (event.getType() == MatchEventType.RED_CARD || event.getType() == MatchEventType.SECOND_YELLOW_CARD) {
                playerStats.redCards++;
            }
        }
        return stats.values().stream().map(MutablePlayerStats::toResponse).toList();
    }

    private boolean isGoal(MatchEvent event) {
        return event.getType() == MatchEventType.GOAL || event.getType() == MatchEventType.OWN_GOAL
                || event.getType() == MatchEventType.PENALTY_GOAL;
    }

    private static final class MutableStanding {
        private final Equipe team;
        private int played;
        private int wins;
        private int draws;
        private int losses;
        private int goalsFor;
        private int goalsAgainst;
        private int points;

        private MutableStanding(Equipe team) {
            this.team = team;
        }

        private int goalDifference() {
            return goalsFor - goalsAgainst;
        }
    }

    private static final class MutablePlayerStats {
        private final UUID playerId;
        private final String playerName;
        private final UUID teamId;
        private final String teamName;
        private long goals;
        private long assists;
        private long yellowCards;
        private long redCards;

        private MutablePlayerStats(MatchEvent event) {
            this(event.getPlayer());
        }

        private MutablePlayerStats(com.tikiscore_server.Player.Player player) {
            this.playerId = player.getId();
            this.playerName = player.getDisplayName();
            this.teamId = player.getEquipe().getId();
            this.teamName = player.getEquipe().getName();
        }

        private PlayerStatisticResponse toResponse() {
            return new PlayerStatisticResponse(playerId, playerName, teamId, teamName,
                    goals, assists, yellowCards, redCards);
        }
    }
}