package com.tikiscore_server.championat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.tikiscore_server.championat.dto.CreateChampionatRequest;
import com.tikiscore_server.championat.enums.CompetitionFormat;
import com.tikiscore_server.role.Role;
import com.tikiscore_server.role.RoleName;
import com.tikiscore_server.role.RoleRepository;
import com.tikiscore_server.user.User;
import com.tikiscore_server.user.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class ChampionatServiceTest {

    private final ChampionatRepository championatRepository = org.mockito.Mockito.mock(ChampionatRepository.class);
    private final UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
    private final RoleRepository roleRepository = org.mockito.Mockito.mock(RoleRepository.class);
    private final ChampionatService service = new ChampionatService(
            championatRepository, userRepository, roleRepository, "/");
    private final UUID organizerId = UUID.randomUUID();
    private final User organizer = new User();

    @BeforeEach
    void setUp() {
        when(championatRepository.existsBySlugIgnoreCase("tournoi-ete")).thenReturn(false);
        when(championatRepository.findAll()).thenReturn(List.of());
        when(userRepository.findById(organizerId)).thenReturn(Optional.of(organizer));
        when(roleRepository.findByName(RoleName.COMPETITION_ADMIN))
                .thenReturn(Optional.of(new Role(RoleName.COMPETITION_ADMIN, "Administrateur de compétition")));
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