package com.tikiscore_server.group;

import com.tikiscore_server.championat.Championat;
import com.tikiscore_server.championat.ChampionatRepository;
import com.tikiscore_server.championat.ChampionatService;
import com.tikiscore_server.equipe.Equipe;
import com.tikiscore_server.equipe.EquipeRepository;
import com.tikiscore_server.group.dto.GroupRequest;
import com.tikiscore_server.group.dto.GroupResponse;
import com.tikiscore_server.group.dto.TeamAssignmentRequest;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CompetitionGroupService {

    private final CompetitionGroupRepository groupRepository;
    private final EquipeRepository equipeRepository;
    private final ChampionatRepository championatRepository;
    private final ChampionatService championatService;

    public CompetitionGroupService(
            CompetitionGroupRepository groupRepository,
            EquipeRepository equipeRepository,
            ChampionatRepository championatRepository,
            ChampionatService championatService
    ) {
        this.groupRepository = groupRepository;
        this.equipeRepository = equipeRepository;
        this.championatRepository = championatRepository;
        this.championatService = championatService;
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> getPublicGroups() {
        UUID championshipId = championatService.getPublicChampionatId();
        return groupRepository.findAllByChampionship_IdOrderByNameAsc(championshipId).stream()
                .map(GroupResponse::from)
                .toList();
    }

    @Transactional
    public GroupResponse createGroup(GroupRequest request) {
        UUID championshipId = championatService.getConfiguredChampionatId();
        if (groupRepository.existsByNameIgnoreCaseAndChampionship_Id(request.name().trim(), championshipId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une poule porte déjà ce nom.");
        }
        Championat championship = championatRepository.findById(championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Championnat introuvable."));
        CompetitionGroup group = new CompetitionGroup();
        group.setName(request.name().trim());
        group.setChampionship(championship);
        return GroupResponse.from(groupRepository.save(group));
    }

    @Transactional
    public GroupResponse updateGroup(UUID groupId, GroupRequest request) {
        UUID championshipId = championatService.getConfiguredChampionatId();
        CompetitionGroup group = groupRepository.findByIdAndChampionship_Id(groupId, championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Poule introuvable."));
        if (!group.getName().equalsIgnoreCase(request.name().trim())
                && groupRepository.existsByNameIgnoreCaseAndChampionship_IdAndIdNot(
                        request.name().trim(), championshipId, groupId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une poule porte déjà ce nom.");
        }
        group.setName(request.name().trim());
        return GroupResponse.from(groupRepository.save(group));
    }

    @Transactional
    public List<GroupResponse> assignTeams(UUID groupId, TeamAssignmentRequest request) {
        UUID championshipId = championatService.getConfiguredChampionatId();
        CompetitionGroup group = groupRepository.findByIdAndChampionship_Id(groupId, championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Poule introuvable."));
        Set<UUID> requestedIds = new HashSet<>(request.teamIds());
        if (requestedIds.size() != request.teamIds().size()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Une équipe apparaît plusieurs fois.");
        }
        List<Equipe> teams = equipeRepository.findAllByChampionship_IdAndActiveTrue(championshipId);
        if (teams.stream().filter(team -> requestedIds.contains(team.getId())).count() != requestedIds.size()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                    "Toutes les équipes doivent appartenir au championnat actif.");
        }
        for (Equipe team : teams) {
            if (group.equals(team.getGroup()) || requestedIds.contains(team.getId())) {
                team.setGroup(requestedIds.contains(team.getId()) ? group : null);
            }
        }
        equipeRepository.saveAll(teams);
        return groupRepository.findAllByChampionship_IdOrderByNameAsc(championshipId).stream()
            .map(GroupResponse::from)
            .toList();
    }
}