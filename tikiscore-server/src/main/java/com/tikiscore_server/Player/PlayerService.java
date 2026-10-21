package com.tikiscore_server.Player;

import com.tikiscore_server.Player.dto.PlayerRequest;
import com.tikiscore_server.Player.dto.PlayerResponse;
import com.tikiscore_server.championat.ChampionatService;
import com.tikiscore_server.equipe.Equipe;
import com.tikiscore_server.equipe.EquipeRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final EquipeRepository equipeRepository;
    private final ChampionatService championatService;

    public PlayerService(
            PlayerRepository playerRepository,
            EquipeRepository equipeRepository,
            ChampionatService championatService
    ) {
        this.playerRepository = playerRepository;
        this.equipeRepository = equipeRepository;
        this.championatService = championatService;
    }

    @Transactional(readOnly = true)
    public List<PlayerResponse> getTeamPlayers(UUID teamId) {
        UUID championshipId = championatService.getPublicChampionatId();
        if (equipeRepository.findByIdAndChampionship_IdAndActiveTrue(teamId, championshipId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Équipe introuvable.");
        }
        return playerRepository.findAllByEquipe_IdAndActiveTrue(teamId).stream()
                .map(PlayerResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlayerResponse getPublicPlayer(UUID playerId) {
        UUID championshipId = championatService.getPublicChampionatId();
        Player player = playerRepository.findByIdAndEquipe_Championship_IdAndActiveTrue(playerId, championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Joueur introuvable."));
        return PlayerResponse.from(player);
    }

    @Transactional
    public PlayerResponse createPlayer(UUID teamId, PlayerRequest request) {
        UUID championshipId = championatService.getConfiguredChampionatId();
        Equipe team = equipeRepository.findByIdAndChampionship_IdAndActiveTrue(teamId, championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Équipe introuvable."));
        if (playerRepository.existsByJerseyNumberAndEquipe_Id(request.jerseyNumber(), teamId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce numéro de maillot est déjà attribué dans l'équipe.");
        }
        Player player = new Player();
        player.setEquipe(team);
        apply(player, request);
        return PlayerResponse.from(playerRepository.save(player));
    }

    @Transactional
    public PlayerResponse updatePlayer(UUID playerId, PlayerRequest request) {
        UUID championshipId = championatService.getConfiguredChampionatId();
        Player player = playerRepository.findByIdAndEquipe_Championship_IdAndActiveTrue(playerId, championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Joueur introuvable."));
        if (!request.jerseyNumber().equals(player.getJerseyNumber())
                && playerRepository.existsByJerseyNumberAndEquipe_Id(
                        request.jerseyNumber(), player.getEquipe().getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce numéro de maillot est déjà attribué dans l'équipe.");
        }
        apply(player, request);
        return PlayerResponse.from(playerRepository.save(player));
    }

    private void apply(Player player, PlayerRequest request) {
        player.setDisplayName(request.displayName().trim());
        player.setJerseyNumber(request.jerseyNumber());
        player.setPosition(request.position());
    }
}