package com.tikiscore_server.equipe;

import com.tikiscore_server.championat.Championat;
import com.tikiscore_server.championat.ChampionatRepository;
import com.tikiscore_server.championat.ChampionatService;
import com.tikiscore_server.equipe.dto.TeamRequest;
import com.tikiscore_server.equipe.dto.TeamResponse;
import com.tikiscore_server.group.CompetitionGroup;
import com.tikiscore_server.group.CompetitionGroupRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EquipeService {

    private final EquipeRepository equipeRepository;
    private final ChampionatRepository championatRepository;
    private final ChampionatService championatService;
    private final CompetitionGroupRepository groupRepository;

    public EquipeService(
            EquipeRepository equipeRepository,
            ChampionatRepository championatRepository,
            ChampionatService championatService,
            CompetitionGroupRepository groupRepository
    ) {
        this.equipeRepository = equipeRepository;
        this.championatRepository = championatRepository;
        this.championatService = championatService;
        this.groupRepository = groupRepository;
    }

    @Transactional(readOnly = true)
    public List<TeamResponse> getPublicTeams() {
        UUID championshipId = championatService.getConfiguredChampionatId();
        return equipeRepository.findAllByChampionship_IdAndActiveTrue(championshipId).stream()
                .map(TeamResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeamResponse getPublicTeam(UUID teamId) {
        UUID championshipId = championatService.getConfiguredChampionatId();
        Equipe team = equipeRepository.findByIdAndChampionship_IdAndActiveTrue(teamId, championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Équipe introuvable."));
        return TeamResponse.from(team);
    }

    @Transactional
    public TeamResponse createTeam(TeamRequest request) {
        UUID championshipId = championatService.getConfiguredChampionatId();
        Championat championship = championatRepository.findById(championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Championnat introuvable."));
        if (equipeRepository.existsByNameIgnoreCaseAndChampionship_Id(request.name().trim(), championshipId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une équipe porte déjà ce nom.");
        }
        Equipe team = new Equipe();
        team.setChampionship(championship);
        apply(team, request, championshipId);
        return TeamResponse.from(equipeRepository.save(team));
    }

    @Transactional
    public TeamResponse updateTeam(UUID teamId, TeamRequest request) {
        UUID championshipId = championatService.getConfiguredChampionatId();
        Equipe team = equipeRepository.findByIdAndChampionship_IdAndActiveTrue(teamId, championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Équipe introuvable."));
        if (!team.getName().equalsIgnoreCase(request.name().trim())
                && equipeRepository.existsByNameIgnoreCaseAndChampionship_IdAndIdNot(
                        request.name().trim(), championshipId, teamId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une équipe porte déjà ce nom.");
        }
        apply(team, request, championshipId);
        return TeamResponse.from(equipeRepository.save(team));
    }

    private void apply(Equipe team, TeamRequest request, UUID championshipId) {
        team.setName(request.name().trim());
        team.setShortName(request.shortName());
        team.setLocality(request.locality());
        team.setPrimaryColor(request.primaryColor());
        team.setSecondaryColor(request.secondaryColor());
        if (request.groupId() == null) {
            team.setGroup(null);
            return;
        }
        CompetitionGroup group = groupRepository.findByIdAndChampionship_Id(request.groupId(), championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                        "La poule sélectionnée n'appartient pas au championnat actif."));
        team.setGroup(group);
    }
}