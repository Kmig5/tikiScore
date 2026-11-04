package com.tikiscore_server.championat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.tikiscore_server.championat.dto.CreateChampionatRequest;
import com.tikiscore_server.championat.enums.CompetitionFormat;
import com.tikiscore_server.championat.enums.ChampionatStatus;
import com.tikiscore_server.equipe.Equipe;
import com.tikiscore_server.membership.ChampionshipMembership;
import com.tikiscore_server.membership.ChampionshipMembershipRepository;
import com.tikiscore_server.match.Match;
import com.tikiscore_server.equipe.EquipeRepository;
import com.tikiscore_server.match.MatchRepository;
import com.tikiscore_server.role.Role;
import com.tikiscore_server.role.RoleName;
import com.tikiscore_server.role.RoleRepository;
import com.tikiscore_server.user.User;
import com.tikiscore_server.user.UserRepository;
import java.util.List;
import java.util.Optional;
import org.mockito.ArgumentCaptor;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class ChampionatServiceTest {

    private final ChampionatRepository championatRepository = org.mockito.Mockito.mock(ChampionatRepository.class);
    private final UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
    private final RoleRepository roleRepository = org.mockito.Mockito.mock(RoleRepository.class);
        private final ChampionshipMembershipRepository membershipRepository = org.mockito.Mockito.mock(ChampionshipMembershipRepository.class);
            private final EquipeRepository equipeRepository = org.mockito.Mockito.mock(EquipeRepository.class);
            private final MatchRepository matchRepository = org.mockito.Mockito.mock(MatchRepository.class);
    private final ChampionatService service = new ChampionatService(
                championatRepository, userRepository, roleRepository, membershipRepository, equipeRepository, matchRepository, "/");
    private final UUID organizerId = UUID.randomUUID();
    private final User organizer = new User();

    @BeforeEach
    void setUp() {
        when(championatRepository.existsBySlugIgnoreCase("tournoi-ete")).thenReturn(false);
        when(championatRepository.findAll()).thenReturn(List.of());
        when(userRepository.findById(organizerId)).thenReturn(Optional.of(organizer));
        when(roleRepository.findByName(RoleName.COMPETITION_ADMIN))
                .thenReturn(Optional.of(new Role(RoleName.COMPETITION_ADMIN, "Administrateur de compétition")));
        when(roleRepository.findByName(RoleName.USER))
            .thenReturn(Optional.of(new Role(RoleName.USER, "Utilisateur")));
        when(championatRepository.save(any(Championat.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createChampionatUsesDefaultScoringWhenValuesAreMissing() {
        var result = service.createChampionat(organizerId, request(null, null, null));

        assertEquals(3, result.pointsForWin());
        assertEquals(1, result.pointsForDraw());
        assertEquals(0, result.pointsForLoss());
    }

    @Test
    void createChampionatAssignsOrganizerRolesOnlyToTheNewChampionshipMembership() {
        service.createChampionat(organizerId, request(null, null, null));

        ArgumentCaptor<ChampionshipMembership> membershipCaptor = ArgumentCaptor.forClass(ChampionshipMembership.class);
        verify(membershipRepository).save(membershipCaptor.capture());
        ChampionshipMembership membership = membershipCaptor.getValue();
        assertSame(organizer, membership.getUser());
        assertTrue(membership.getRoles().stream().anyMatch(role -> role.getName() == RoleName.USER));
        assertTrue(membership.getRoles().stream().anyMatch(role -> role.getName() == RoleName.COMPETITION_ADMIN));
    }

    @Test
    void activateDraftRequiresTwoTeamsAndAScheduledMatch() {
        Championat draft = new Championat();
        draft.setId(UUID.randomUUID());
        draft.setName("Tournoi d'été");
        draft.setSlug("tournoi-ete");
        draft.setFormat(CompetitionFormat.LIGUE);
        draft.setStatus(ChampionatStatus.BROUILLON);
        when(championatRepository.findAll()).thenReturn(List.of(draft));

        assertThrows(ResponseStatusException.class, service::publishChampionat);
        verify(championatRepository, never()).save(draft);
    }

    @Test
    void activateConfiguredDraftMakesItPublicAndActive() {
        Championat draft = new Championat();
        draft.setId(UUID.randomUUID());
        draft.setName("Tournoi d'été");
        draft.setSlug("tournoi-ete");
        draft.setFormat(CompetitionFormat.LIGUE);
        draft.setStatus(ChampionatStatus.BROUILLON);
        when(championatRepository.findAll()).thenReturn(List.of(draft));
        when(equipeRepository.findAllByChampionship_IdAndActiveTrue(draft.getId()))
                .thenReturn(List.of(new Equipe(), new Equipe()));
        when(matchRepository.findAllByChampionship_IdOrderByStartsAtAsc(draft.getId()))
                .thenReturn(List.of(new Match()));

        var result = service.publishChampionat();

        assertEquals(ChampionatStatus.EN_COURS.name(), result.status());
    }

    @Test
    void createChampionatRejectsInvalidScoringBeforeSaving() {
        var request = request(1, 2, 0);

        assertThrows(ResponseStatusException.class, () -> service.createChampionat(organizerId, request));

        verify(championatRepository, never()).save(any(Championat.class));
    }

    private CreateChampionatRequest request(Integer pointsForWin, Integer pointsForDraw, Integer pointsForLoss) {
        return new CreateChampionatRequest(
                "Tournoi d'été", "tournoi-ete", null, null, null, null, null,
                CompetitionFormat.LIGUE, null, pointsForWin, pointsForDraw, pointsForLoss, null);
    }
}