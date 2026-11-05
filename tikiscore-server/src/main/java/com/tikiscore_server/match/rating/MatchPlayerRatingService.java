package com.tikiscore_server.match.rating;

import com.tikiscore_server.Player.Player;
import com.tikiscore_server.Player.PlayerRepository;
import com.tikiscore_server.championat.ChampionatService;
import com.tikiscore_server.championat.enums.ChampionatStatus;
import com.tikiscore_server.equipe.Equipe;
import com.tikiscore_server.match.Match;
import com.tikiscore_server.match.MatchRepository;
import com.tikiscore_server.match.MatchStatus;
import com.tikiscore_server.user.User;
import com.tikiscore_server.user.UserRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MatchPlayerRatingService {

    private static final List<MatchStatus> RATEABLE_STATUSES = List.of(
            MatchStatus.LIVE_FIRST_HALF, MatchStatus.HALF_TIME, MatchStatus.LIVE_SECOND_HALF, MatchStatus.PAUSED);

    private final ChampionatService championatService;
    private final MatchRepository matchRepository;
    private final PlayerRepository playerRepository;
    private final UserRepository userRepository;
    private final MatchPlayerRatingRepository ratingRepository;

    public MatchPlayerRatingService(
            ChampionatService championatService,
            MatchRepository matchRepository,
            PlayerRepository playerRepository,
            UserRepository userRepository,
            MatchPlayerRatingRepository ratingRepository
    ) {
        this.championatService = championatService;
        this.matchRepository = matchRepository;
        this.playerRepository = playerRepository;
        this.userRepository = userRepository;
        this.ratingRepository = ratingRepository;
    }

    @Transactional(readOnly = true)
    public MatchPlayerRatingResponse getRatings(UUID matchId, UUID userId) {
        UUID championshipId = championatService.getPublicChampionatId();
        Match match = matchRepository.findByIdAndChampionship_Id(matchId, championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match introuvable."));
        List<MatchPlayerRating> ratings = ratingRepository.findAllByMatch_IdAndMatch_Championship_Id(matchId, championshipId);
        List<MatchPlayerRating> ownRatings = userId == null ? List.of()
                : ratingRepository.findAllByMatch_IdAndMatch_Championship_IdAndUser_Id(matchId, championshipId, userId);
        return toResponse(match, ratings, ownRatings);
    }

    @Transactional
    public MatchPlayerRatingResponse ratePlayer(UUID matchId, UUID playerId, UUID userId, int score) {
        if (score < 1 || score > 5) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "La note doit être comprise entre 1 et 5.");
        }
        UUID championshipId = championatService.getConfiguredChampionatId();
        Match match = matchRepository.findForUpdate(matchId, championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match introuvable."));
        if (match.getChampionship().getStatus() != ChampionatStatus.EN_COURS
                || !RATEABLE_STATUSES.contains(match.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Les notes sont fermées pour ce match.");
        }
        Player player = playerRepository.findByIdAndEquipe_Championship_IdAndActiveTrue(playerId, championshipId)
                .filter(candidate -> isParticipant(candidate, match))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                        "Le joueur ne fait pas partie des équipes de ce match."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        MatchPlayerRating rating = ratingRepository
                .findByMatch_IdAndMatch_Championship_IdAndPlayer_IdAndUser_Id(matchId, championshipId, playerId, userId)
                .orElseGet(MatchPlayerRating::new);
        rating.setMatch(match);
        rating.setPlayer(player);
        rating.setUser(user);
        rating.setScore(score);
        ratingRepository.save(rating);
        List<MatchPlayerRating> ratings = ratingRepository.findAllByMatch_IdAndMatch_Championship_Id(matchId, championshipId);
        List<MatchPlayerRating> ownRatings = ratingRepository.findAllByMatch_IdAndMatch_Championship_IdAndUser_Id(
                matchId, championshipId, userId);
        return toResponse(match, ratings, ownRatings);
    }

    private MatchPlayerRatingResponse toResponse(
            Match match,
            List<MatchPlayerRating> ratings,
            List<MatchPlayerRating> ownRatings
    ) {
        boolean resultsVisible = match.getStatus() == MatchStatus.FINISHED;
        boolean ratingsOpen = match.getChampionship().getStatus() == ChampionatStatus.EN_COURS
                && RATEABLE_STATUSES.contains(match.getStatus());
        Map<UUID, RatingSummary> summaries = new HashMap<>();
        if (resultsVisible) {
            for (MatchPlayerRating rating : ratings) {
                summaries.computeIfAbsent(rating.getPlayer().getId(), ignored -> new RatingSummary())
                        .add(rating.getScore());
            }
        }
        Map<UUID, Integer> ownScores = new HashMap<>();
        for (MatchPlayerRating rating : ownRatings) ownScores.put(rating.getPlayer().getId(), rating.getScore());

        List<Player> players = new ArrayList<>();
        players.addAll(playerRepository.findAllByEquipe_IdAndActiveTrue(match.getHomeTeam().getId()));
        players.addAll(playerRepository.findAllByEquipe_IdAndActiveTrue(match.getAwayTeam().getId()));
        Double bestAverage = summaries.values().stream().map(RatingSummary::average)
                .max(Comparator.naturalOrder()).orElse(null);
        List<MatchPlayerRatingResponse.PlayerRating> playerRatings = players.stream()
                .map(player -> {
                    RatingSummary summary = summaries.get(player.getId());
                    Double average = summary == null ? null : summary.average();
                    return new MatchPlayerRatingResponse.PlayerRating(
                            player.getId(), player.getEquipe().getId(), player.getDisplayName(), player.getEquipe().getName(),
                            ownScores.get(player.getId()), average, summary == null ? 0 : summary.count,
                            average != null && average.equals(bestAverage));
                })
                .toList();
        return new MatchPlayerRatingResponse(match.getId(), match.getStatus().name(), ratingsOpen, resultsVisible, playerRatings);
    }

    private boolean isParticipant(Player player, Match match) {
        UUID teamId = player.getEquipe().getId();
        return teamId.equals(match.getHomeTeam().getId()) || teamId.equals(match.getAwayTeam().getId());
    }

    private static final class RatingSummary {
        private long total;
        private long count;

        private void add(int score) {
            total += score;
            count++;
        }

        private Double average() {
            return count == 0 ? null : (double) total / count;
        }
    }
}