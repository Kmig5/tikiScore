package com.tikiscore_server.match.rating;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.tikiscore_server.Player.Player;
import com.tikiscore_server.Player.PlayerRepository;
import com.tikiscore_server.championat.Championat;
import com.tikiscore_server.championat.ChampionatService;
import com.tikiscore_server.championat.enums.ChampionatStatus;
import com.tikiscore_server.equipe.Equipe;
import com.tikiscore_server.match.Match;
import com.tikiscore_server.match.MatchRepository;
import com.tikiscore_server.match.MatchStatus;
import com.tikiscore_server.user.User;
import com.tikiscore_server.user.UserRepository;
import java.util.List;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class MatchPlayerRatingServiceTest {

    private final ChampionatService championatService = org.mockito.Mockito.mock(ChampionatService.class);
    private final MatchRepository matchRepository = org.mockito.Mockito.mock(MatchRepository.class);
    private final PlayerRepository playerRepository = org.mockito.Mockito.mock(PlayerRepository.class);
    private final UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
    private final MatchPlayerRatingRepository ratingRepository = org.mockito.Mockito.mock(MatchPlayerRatingRepository.class);
    private final MatchPlayerRatingService service = new MatchPlayerRatingService(
            championatService, matchRepository, playerRepository, userRepository, ratingRepository);

    private final UUID championshipId = UUID.randomUUID();
    private final UUID matchId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final UUID firstPlayerId = UUID.randomUUID();
    private final UUID secondPlayerId = UUID.randomUUID();
    private final List<MatchPlayerRating> storedRatings = new ArrayList<>();
    private Match match;
    private Player firstPlayer;
    private User user;

    @BeforeEach
    void setUp() {
        Championat championship = new Championat();
        championship.setId(championshipId);
        championship.setStatus(ChampionatStatus.EN_COURS);
        Equipe home = team("A", championship);
        Equipe away = team("B", championship);
        match = new Match();
        match.setId(matchId);
        match.setChampionship(championship);
        match.setHomeTeam(home);
        match.setAwayTeam(away);
        match.setStatus(MatchStatus.LIVE_FIRST_HALF);

        firstPlayer = player(firstPlayerId, "Joueuse A", home);
        Player secondPlayer = player(secondPlayerId, "Joueur B", away);
        user = new User();
        user.setId(userId);

        when(championatService.getConfiguredChampionatId()).thenReturn(championshipId);
        when(championatService.getPublicChampionatId()).thenReturn(championshipId);
        when(matchRepository.findForUpdate(matchId, championshipId)).thenReturn(Optional.of(match));
        when(matchRepository.findByIdAndChampionship_Id(matchId, championshipId)).thenReturn(Optional.of(match));
        when(playerRepository.findByIdAndEquipe_Championship_IdAndActiveTrue(firstPlayerId, championshipId))
                .thenReturn(Optional.of(firstPlayer));
        when(playerRepository.findAllByEquipe_IdAndActiveTrue(home.getId())).thenReturn(List.of(firstPlayer));
        when(playerRepository.findAllByEquipe_IdAndActiveTrue(away.getId())).thenReturn(List.of(secondPlayer));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(ratingRepository.save(any(MatchPlayerRating.class))).thenAnswer(invocation -> {
            MatchPlayerRating rating = invocation.getArgument(0);
            storedRatings.removeIf(existing -> existing.getMatch().equals(rating.getMatch())
                && existing.getPlayer().equals(rating.getPlayer())
                && existing.getUser().equals(rating.getUser()));
            storedRatings.add(rating);
            return rating;
        });
        when(ratingRepository.findByMatch_IdAndMatch_Championship_IdAndPlayer_IdAndUser_Id(
                matchId, championshipId, firstPlayerId, userId)).thenReturn(Optional.empty());
        when(ratingRepository.findAllByMatch_IdAndMatch_Championship_Id(matchId, championshipId))
            .thenAnswer(invocation -> List.copyOf(storedRatings));
        when(ratingRepository.findAllByMatch_IdAndMatch_Championship_IdAndUser_Id(matchId, championshipId, userId))
            .thenAnswer(invocation -> storedRatings.stream().filter(rating -> rating.getUser().getId().equals(userId)).toList());
    }

    @Test
    void ratePlayerLocksMatchAndHidesAggregatesUntilFinished() {
        var response = service.ratePlayer(matchId, firstPlayerId, userId, 4);

        assertTrue(response.ratingsOpen());
        assertFalse(response.resultsVisible());
        assertEquals(4, response.players().getFirst().myRating());
        assertEquals(null, response.players().getFirst().averageRating());
        verify(matchRepository).findForUpdate(matchId, championshipId);
        verify(ratingRepository).save(any(MatchPlayerRating.class));
    }

    @Test
    void ratingIsRejectedAfterTheFinalWhistle() {
        match.setStatus(MatchStatus.FINISHED);

        assertThrows(ResponseStatusException.class, () -> service.ratePlayer(matchId, firstPlayerId, userId, 4));

        verify(ratingRepository, never()).save(any(MatchPlayerRating.class));
    }

    @Test
    void userCanReplaceTheirRatingBeforeTheFinalWhistle() {
        MatchPlayerRating existing = rating(firstPlayer, user, 2);
        storedRatings.add(existing);
        when(ratingRepository.findByMatch_IdAndMatch_Championship_IdAndPlayer_IdAndUser_Id(
                matchId, championshipId, firstPlayerId, userId)).thenReturn(Optional.of(existing));

        var response = service.ratePlayer(matchId, firstPlayerId, userId, 5);

        assertSame(existing, storedRatings.getFirst());
        assertEquals(5, existing.getScore());
        assertEquals(5, response.players().getFirst().myRating());
        assertEquals(1, storedRatings.size());
    }

    @Test
    void finishedMatchSelectsEveryPlayerTiedForHighestAverage() {
        match.setStatus(MatchStatus.FINISHED);
        MatchPlayerRating firstRating = rating(firstPlayer, user, 5);
        MatchPlayerRating secondRating = rating(player(secondPlayerId, "Joueur B", match.getAwayTeam()), user, 5);
        when(ratingRepository.findAllByMatch_IdAndMatch_Championship_Id(matchId, championshipId))
                .thenReturn(List.of(firstRating, secondRating));

        var response = service.getRatings(matchId, userId);

        assertTrue(response.resultsVisible());
        assertFalse(response.ratingsOpen());
        assertTrue(response.players().stream().allMatch(MatchPlayerRatingResponse.PlayerRating::manOfTheMatch));
        assertEquals(5.0, response.players().getFirst().averageRating());
    }

    @Test
    void manOfTheMatchUsesAverageRatherThanSingleHighestRating() {
        match.setStatus(MatchStatus.FINISHED);
        User secondVoter = new User();
        secondVoter.setId(UUID.randomUUID());
        Player secondPlayer = player(secondPlayerId, "Joueur B", match.getAwayTeam());
        List<MatchPlayerRating> ratings = List.of(
                rating(firstPlayer, user, 5),
                rating(firstPlayer, secondVoter, 1),
                rating(secondPlayer, user, 4));
        when(ratingRepository.findAllByMatch_IdAndMatch_Championship_Id(matchId, championshipId))
                .thenReturn(ratings);

        var response = service.getRatings(matchId, userId);

        assertEquals(3.0, response.players().getFirst().averageRating());
        assertFalse(response.players().getFirst().manOfTheMatch());
        assertEquals(4.0, response.players().get(1).averageRating());
        assertTrue(response.players().get(1).manOfTheMatch());
    }

    private Equipe team(String name, Championat championship) {
        Equipe team = new Equipe();
        team.setId(UUID.randomUUID());
        team.setName(name);
        team.setChampionship(championship);
        return team;
    }

    private Player player(UUID id, String name, Equipe team) {
        Player player = new Player();
        player.setId(id);
        player.setDisplayName(name);
        player.setEquipe(team);
        return player;
    }

    private MatchPlayerRating rating(Player player, User author, int score) {
        MatchPlayerRating rating = new MatchPlayerRating();
        rating.setMatch(match);
        rating.setPlayer(player);
        rating.setUser(author);
        rating.setScore(score);
        return rating;
    }
}