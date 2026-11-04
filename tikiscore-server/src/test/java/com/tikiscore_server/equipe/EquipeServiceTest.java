package com.tikiscore_server.equipe;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.tikiscore_server.championat.ChampionatRepository;
import com.tikiscore_server.championat.ChampionatService;
import com.tikiscore_server.group.CompetitionGroupRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class EquipeServiceTest {

    private final EquipeRepository equipeRepository = mock(EquipeRepository.class);
    private final ChampionatService championatService = mock(ChampionatService.class);
    private final EquipeService service = new EquipeService(
            equipeRepository,
            mock(ChampionatRepository.class),
            championatService,
            mock(CompetitionGroupRepository.class));

    @Test
    void getPublicTeamsUsesPublicChampionshipScope() {
        UUID publicChampionshipId = UUID.randomUUID();
        when(championatService.getPublicChampionatId()).thenReturn(publicChampionshipId);
        when(equipeRepository.findAllByChampionship_IdAndActiveTrue(publicChampionshipId)).thenReturn(List.of());

        assertTrue(service.getPublicTeams().isEmpty());

        verify(championatService).getPublicChampionatId();
    }

    @Test
    void getPublicTeamDoesNotUseUnpublishedChampionshipScope() {
        UUID publicChampionshipId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        when(championatService.getPublicChampionatId()).thenReturn(publicChampionshipId);
        when(equipeRepository.findByIdAndChampionship_IdAndActiveTrue(teamId, publicChampionshipId))
                .thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> service.getPublicTeam(teamId));

        verify(championatService).getPublicChampionatId();
        verify(championatService, never()).getConfiguredChampionatId();
    }
}