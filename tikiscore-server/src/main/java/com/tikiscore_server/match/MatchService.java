package com.tikiscore_server.match;

import com.tikiscore_server.Player.Player;
import com.tikiscore_server.Player.PlayerRepository;
import com.tikiscore_server.audit.AuditService;
import com.tikiscore_server.championat.Championat;
import com.tikiscore_server.championat.ChampionatRepository;
import com.tikiscore_server.championat.ChampionatService;
import com.tikiscore_server.equipe.Equipe;
import com.tikiscore_server.equipe.EquipeRepository;
import com.tikiscore_server.group.CompetitionGroup;
import com.tikiscore_server.group.CompetitionGroupRepository;
import com.tikiscore_server.match.dto.AssignManagersRequest;
import com.tikiscore_server.match.dto.CreateMatchRequest;
import com.tikiscore_server.match.dto.MatchEventRequest;
import com.tikiscore_server.match.dto.MatchEventResponse;
import com.tikiscore_server.match.dto.MatchResponse;
import com.tikiscore_server.match.dto.UpdateMatchRequest;
import com.tikiscore_server.match.live.MatchLiveUpdate;
import com.tikiscore_server.notification.NotificationService;
import com.tikiscore_server.notification.NotificationType;
import com.tikiscore_server.role.RoleName;
import com.tikiscore_server.user.User;
import com.tikiscore_server.user.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MatchService {

    private static final List<MatchStatus> LIVE_STATUSES = List.of(
            MatchStatus.LIVE_FIRST_HALF, MatchStatus.HALF_TIME, MatchStatus.LIVE_SECOND_HALF, MatchStatus.PAUSED);

    private final MatchRepository matchRepository;
    private final MatchEventRepository eventRepository;
    private final ChampionatRepository championatRepository;
    private final ChampionatService championatService;
    private final EquipeRepository equipeRepository;
    private final CompetitionGroupRepository groupRepository;
    private final PlayerRepository playerRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public MatchService(
            MatchRepository matchRepository,
            MatchEventRepository eventRepository,
            ChampionatRepository championatRepository,
            ChampionatService championatService,
            EquipeRepository equipeRepository,
            CompetitionGroupRepository groupRepository,
            PlayerRepository playerRepository,
            UserRepository userRepository,
            ApplicationEventPublisher eventPublisher,
            AuditService auditService,
            NotificationService notificationService
    ) {
        this.matchRepository = matchRepository;
        this.eventRepository = eventRepository;
        this.championatRepository = championatRepository;
        this.championatService = championatService;
        this.equipeRepository = equipeRepository;
        this.groupRepository = groupRepository;
        this.playerRepository = playerRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<MatchResponse> getPublicMatches() {
        return matchRepository.findAllByChampionship_IdOrderByStartsAtAsc(championatService.getPublicChampionatId())
                .stream().map(MatchResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<MatchResponse> getMatchesToday() {
        UUID championshipId = championatService.getPublicChampionatId();
        ZoneId zone = ZoneId.of(requireChampionship(championshipId).getTimeZone());
        LocalDate today = LocalDate.now(zone);
        Instant start = today.atStartOfDay(zone).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);
        return matchRepository.findAllByChampionship_IdAndStartsAtBetweenOrderByStartsAtAsc(
            championshipId, start, end).stream().map(MatchResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<MatchResponse> getUpcomingMatches() {
        return matchRepository.findAllByChampionship_IdAndStatusAndStartsAtAfterOrderByStartsAtAsc(
                championatService.getPublicChampionatId(), MatchStatus.SCHEDULED, Instant.now())
                .stream().map(MatchResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<MatchResponse> getLiveMatches() {
        return matchRepository.findAllByChampionship_IdAndStatusInOrderByStartsAtAsc(
                championatService.getPublicChampionatId(), LIVE_STATUSES).stream().map(MatchResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public MatchResponse getPublicMatch(UUID matchId) {
        return MatchResponse.from(requireMatch(matchId, championatService.getPublicChampionatId()));
    }

    @Transactional(readOnly = true)
    public List<MatchResponse> getAssignedMatches(UUID managerId) {
        return matchRepository.findAllByAssignedManagers_IdAndChampionship_IdOrderByStartsAtAsc(
                managerId, championatService.getConfiguredChampionatId()).stream().map(MatchResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public MatchResponse getAssignedMatch(UUID matchId, UUID managerId) {
        return MatchResponse.from(requireAssignedMatch(matchId, managerId));
    }

    @Transactional
    public MatchResponse createMatch(CreateMatchRequest request) {
        UUID championshipId = championatService.getConfiguredChampionatId();
        Match match = new Match();
        match.setChampionship(requireChampionship(championshipId));
        applySchedule(match, request.startsAt(), request.venue(), request.groupId(),
                request.homeTeamId(), request.awayTeamId(), championshipId);
        return MatchResponse.from(matchRepository.save(match));
    }

    @Transactional
    public MatchResponse updateMatch(UUID matchId, UpdateMatchRequest request) {
        Match match = requireMatchForUpdate(matchId, championatService.getConfiguredChampionatId());
        if (match.getStatus() != MatchStatus.SCHEDULED && match.getStatus() != MatchStatus.POSTPONED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seul un match programmé peut être modifié.");
        }
        boolean scheduleChanged = !match.getStartsAt().equals(request.startsAt())
            || !java.util.Objects.equals(match.getVenue(), request.venue());
        applySchedule(match, request.startsAt(), request.venue(), request.groupId(),
                request.homeTeamId(), request.awayTeamId(), match.getChampionship().getId());
        Match saved = matchRepository.save(match);
        if (scheduleChanged) notificationService.notifyScheduleChange(saved, NotificationType.SCHEDULE_CHANGED);
        return MatchResponse.from(saved);
    }

        @Transactional
        public MatchResponse postpone(UUID matchId, UUID actorId) {
        return changeScheduleStatus(matchId, actorId, MatchStatus.POSTPONED,
            MatchEventType.MATCH_POSTPONED, NotificationType.MATCH_POSTPONED);
        }

        @Transactional
        public MatchResponse cancel(UUID matchId, UUID actorId) {
        return changeScheduleStatus(matchId, actorId, MatchStatus.CANCELLED,
            MatchEventType.MATCH_CANCELLED, NotificationType.MATCH_CANCELLED);
        }

    @Transactional
    public MatchResponse assignManagers(UUID matchId, AssignManagersRequest request, UUID actorId) {
        Match match = requireMatchForUpdate(matchId, championatService.getConfiguredChampionatId());
        Set<UUID> managerIds = new HashSet<>(request.managerIds());
        if (managerIds.size() != request.managerIds().size()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Un gestionnaire apparaît plusieurs fois.");
        }
        List<User> managers = userRepository.findAllById(managerIds);
        if (managers.size() != managerIds.size()
                || managers.stream().anyMatch(user -> user.getRoles().stream()
                        .noneMatch(role -> role.getName() == RoleName.MATCH_MANAGER))) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                    "Chaque utilisateur affecté doit posséder le rôle gestionnaire de match.");
        }
        match.setAssignedManagers(new HashSet<>(managers));
        auditService.record(actorId, "MATCH_MANAGERS_ASSIGNED", "Match", match.getId(),
            "managerCount=" + managers.size());
        return MatchResponse.from(matchRepository.save(match));
    }

    @Transactional
    public MatchResponse transition(UUID matchId, UUID managerId, MatchStatus target) {
        Match match = requireAssignedMatchForUpdate(matchId, managerId);
        MatchStatus current = match.getStatus();
        if (!MatchRules.canTransition(current, match.getStatusBeforePause(), target)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Transition de match invalide.");
        }
        if (target == MatchStatus.PAUSED) {
            match.setStatusBeforePause(current);
        } else if (current == MatchStatus.PAUSED && target != MatchStatus.PAUSED) {
            match.setStatusBeforePause(null);
        }
        match.setStatus(target);
        Match saved = matchRepository.save(match);
        MatchEventType eventType = switch (target) {
                case LIVE_FIRST_HALF -> current == MatchStatus.PAUSED
                    ? MatchEventType.MATCH_RESUMED : MatchEventType.MATCH_STARTED;
            case HALF_TIME -> MatchEventType.HALF_TIME_STARTED;
            case LIVE_SECOND_HALF -> current == MatchStatus.HALF_TIME
                ? MatchEventType.SECOND_HALF_STARTED : MatchEventType.MATCH_RESUMED;
            case PAUSED -> MatchEventType.MATCH_PAUSED;
            case FINISHED -> MatchEventType.MATCH_ENDED;
            default -> throw new ResponseStatusException(HttpStatus.CONFLICT, "Transition de match invalide.");
        };
        MatchEvent event = appendEvent(saved, requireUser(managerId), eventType, "lifecycle-" + UUID.randomUUID());
        auditService.record(managerId, "MATCH_STATUS_CHANGED", "Match", matchId,
            current.name() + "->" + target.name());
        notificationService.notifyMatchEvent(saved, event);
        publish(saved, event);
        return MatchResponse.from(saved);
    }

    @Transactional
    public MatchResponse resume(UUID matchId, UUID managerId) {
        Match match = requireAssignedMatchForUpdate(matchId, managerId);
        if (match.getStatus() != MatchStatus.HALF_TIME && match.getStatus() != MatchStatus.PAUSED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seul un match interrompu peut reprendre.");
        }
        MatchStatus target;
        try {
            target = MatchRules.resumeStatus(match.getStatus(), match.getStatusBeforePause());
        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seul un match interrompu peut reprendre.");
        }
        return transition(matchId, managerId, target);
    }

    @Transactional
    public MatchEventResponse recordEvent(UUID matchId, UUID managerId, MatchEventRequest request) {
        Match match = requireAssignedMatchForUpdate(matchId, managerId);
        MatchEvent existing = eventRepository.findByMatch_IdAndClientEventId(matchId, request.clientEventId())
                .orElse(null);
        if (existing != null) {
            boolean samePayload = existing.getType() == request.type()
                    && existing.getMinute() == request.minute()
                    && existing.getAddedTime() == request.addedTime()
                    && sameId(existing.getTeam(), request.teamId())
                    && sameId(existing.getPlayer(), request.playerId())
                    && sameId(existing.getRelatedPlayer(), request.relatedPlayerId())
                    && (request.type() != MatchEventType.SCORE_CORRECTION
                    || (java.util.Objects.equals(existing.getHomeScoreAfter(), request.correctedHomeScore())
                    && java.util.Objects.equals(existing.getAwayScoreAfter(), request.correctedAwayScore())));
            if (!samePayload) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "La clé d'idempotence a déjà été utilisée pour un autre événement.");
            }
            return MatchEventResponse.from(existing);
        }
        if (!LIVE_STATUSES.contains(match.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Le match n'est pas en cours.");
        }
        if (request.type() == MatchEventType.MATCH_STARTED || request.type() == MatchEventType.MATCH_PAUSED
                || request.type() == MatchEventType.MATCH_RESUMED || request.type() == MatchEventType.HALF_TIME_STARTED
                || request.type() == MatchEventType.SECOND_HALF_STARTED || request.type() == MatchEventType.MATCH_ENDED
                || request.type() == MatchEventType.MATCH_POSTPONED || request.type() == MatchEventType.MATCH_CANCELLED) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                    "Utilisez la commande dédiée pour modifier l'état du match.");
        }
        if ((request.type() == MatchEventType.YELLOW_CARD || request.type() == MatchEventType.SECOND_YELLOW_CARD
                || request.type() == MatchEventType.RED_CARD) && request.playerId() == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Le joueur sanctionné est requis.");
        }
        if (request.type() == MatchEventType.SUBSTITUTION
                && (request.playerId() == null || request.relatedPlayerId() == null)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                    "Les joueurs sortant et entrant sont requis pour un remplacement.");
        }
        Equipe team = request.teamId() == null ? null : requireParticipantTeam(match, request.teamId());
        Player player = request.playerId() == null ? null : requireTeamPlayer(request.playerId(), team);
        Player relatedPlayer = request.relatedPlayerId() == null ? null : requireTeamPlayer(request.relatedPlayerId(), team);
        if (request.type() == MatchEventType.SUBSTITUTION && player.getId().equals(relatedPlayer.getId())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                "Le joueur entrant doit être différent du joueur sortant.");
        }
        int homeScore = match.getHomeScore();
        int awayScore = match.getAwayScore();
        if (request.type() == MatchEventType.SCORE_CORRECTION) {
            if (request.correctedHomeScore() == null || request.correctedAwayScore() == null) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                        "Une correction doit contenir les deux nouveaux scores.");
            }
            homeScore = request.correctedHomeScore();
            awayScore = request.correctedAwayScore();
        } else if (request.type() == MatchEventType.GOAL || request.type() == MatchEventType.OWN_GOAL
                || request.type() == MatchEventType.PENALTY_GOAL) {
            if (team == null) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "L'équipe créditée est requise.");
            }
                boolean scoreForHome = request.type() == MatchEventType.OWN_GOAL
                    ? team.getId().equals(match.getAwayTeam().getId())
                    : team.getId().equals(match.getHomeTeam().getId());
                if (scoreForHome) homeScore++;
                else awayScore++;
        }
        MatchEvent event = new MatchEvent();
        event.setMatch(match);
        event.setClientEventId(request.clientEventId());
        event.setType(request.type());
        event.setTeam(team);
        event.setPlayer(player);
        event.setRelatedPlayer(relatedPlayer);
        event.setAuthor(requireUser(managerId));
        event.setMinute(request.minute());
        event.setAddedTime(request.addedTime());
        event.setSequence(eventRepository.findFirstByMatch_IdOrderBySequenceDesc(matchId)
                .map(previous -> previous.getSequence() + 1).orElse(1L));
        match.setHomeScore(homeScore);
        match.setAwayScore(awayScore);
        match.setMinute(Math.max(match.getMinute(), request.minute()));
        event.setHomeScoreAfter(homeScore);
        event.setAwayScoreAfter(awayScore);
        matchRepository.save(match);
        MatchEvent savedEvent = eventRepository.save(event);
        if (isScoreEvent(request.type())) {
            auditService.record(managerId, "MATCH_SCORE_EVENT", "MatchEvent", savedEvent.getId(),
                request.type().name() + ";sequence=" + savedEvent.getSequence());
        }
        notificationService.notifyMatchEvent(match, savedEvent);
        publish(match, savedEvent);
        return MatchEventResponse.from(savedEvent);
    }

    @Transactional
    public MatchEventResponse cancelEvent(UUID matchId, UUID eventId, UUID managerId) {
        Match match = requireAssignedMatchForUpdate(matchId, managerId);
        MatchEvent event = eventRepository.findById(eventId)
                .filter(candidate -> candidate.getMatch().getId().equals(matchId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Événement introuvable."));
        if (event.getState() == MatchEventState.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet événement est déjà annulé.");
        }
        if (isLifecycleEvent(event.getType())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Une transition de match ne peut pas être annulée comme un événement sportif.");
        }
        event.setState(MatchEventState.CANCELLED);
        event.setCancellationAuthor(requireUser(managerId));
        recalculateScore(match);
        matchRepository.save(match);
        MatchEvent savedEvent = eventRepository.save(event);
        auditService.record(managerId, "MATCH_EVENT_CANCELLED", "MatchEvent", savedEvent.getId(),
            "matchId=" + matchId + ";sequence=" + savedEvent.getSequence());
        publish(match, savedEvent);
        return MatchEventResponse.from(savedEvent);
    }

    @Transactional(readOnly = true)
    public List<MatchEventResponse> getEvents(UUID matchId, long afterSequence) {
        Match match = requireMatch(matchId, championatService.getPublicChampionatId());
        return eventRepository.findAllByMatch_IdAndSequenceGreaterThanOrderBySequenceAsc(
            match.getId(), Math.max(afterSequence, 0))
                .stream().map(MatchEventResponse::from).toList();
    }

    private void recalculateScore(Match match) {
        int home = 0;
        int away = 0;
        List<MatchEvent> events = eventRepository.findAllByMatch_IdAndStateOrderBySequenceAsc(
                match.getId(), MatchEventState.ACTIVE);
        for (MatchEvent active : events) {
            if (active.getType() == MatchEventType.SCORE_CORRECTION) {
                home = active.getHomeScoreAfter();
                away = active.getAwayScoreAfter();
            } else if (active.getType() == MatchEventType.GOAL || active.getType() == MatchEventType.PENALTY_GOAL
                    || active.getType() == MatchEventType.OWN_GOAL) {
                boolean scoreForHome = active.getType() == MatchEventType.OWN_GOAL
                    ? active.getTeam().getId().equals(match.getAwayTeam().getId())
                    : active.getTeam().getId().equals(match.getHomeTeam().getId());
                if (scoreForHome) home++;
                else away++;
            }
        }
        match.setHomeScore(home);
        match.setAwayScore(away);
    }

    private MatchEvent appendEvent(Match match, User author, MatchEventType type, String clientEventId) {
        MatchEvent event = new MatchEvent();
        event.setMatch(match);
        event.setClientEventId(clientEventId);
        event.setType(type);
        event.setAuthor(author);
        event.setMinute(match.getMinute());
        event.setAddedTime(0);
        event.setSequence(eventRepository.findFirstByMatch_IdOrderBySequenceDesc(match.getId())
                .map(previous -> previous.getSequence() + 1).orElse(1L));
        event.setHomeScoreAfter(match.getHomeScore());
        event.setAwayScoreAfter(match.getAwayScore());
        return eventRepository.save(event);
    }

    private MatchResponse changeScheduleStatus(
            UUID matchId, UUID actorId, MatchStatus status, MatchEventType eventType, NotificationType notificationType
    ) {
        Match match = requireMatchForUpdate(matchId, championatService.getConfiguredChampionatId());
        if (match.getStatus() != MatchStatus.SCHEDULED && match.getStatus() != MatchStatus.POSTPONED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seul un match non commencé peut être reporté ou annulé.");
        }
        match.setStatus(status);
        Match saved = matchRepository.save(match);
        MatchEvent event = appendEvent(saved, requireUser(actorId), eventType, "schedule-" + UUID.randomUUID());
        auditService.record(actorId, eventType.name(), "Match", matchId, null);
        notificationService.notifyScheduleChange(saved, notificationType);
        publish(saved, event);
        return MatchResponse.from(saved);
    }

    private void publish(Match match, MatchEvent event) {
        MatchEventResponse eventResponse = MatchEventResponse.from(event);
        eventPublisher.publishEvent(new MatchLiveUpdate(
                UUID.randomUUID(),
                event.getState() == MatchEventState.CANCELLED ? "EVENT_CANCELLED" : event.getType().name(),
                match.getId(),
                event.getSequence(),
                Instant.now(),
                MatchResponse.from(match),
                eventResponse
        ));
    }

    private void applySchedule(
            Match match, Instant startsAt, String venue, UUID groupId,
            UUID homeTeamId, UUID awayTeamId, UUID championshipId
    ) {
        if (homeTeamId.equals(awayTeamId)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Une équipe ne peut pas jouer contre elle-même.");
        }
        Equipe home = requireTeam(homeTeamId, championshipId);
        Equipe away = requireTeam(awayTeamId, championshipId);
        CompetitionGroup group = groupId == null ? null : groupRepository.findByIdAndChampionship_Id(groupId, championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Poule invalide."));
        if (group != null && ((home.getGroup() != null && !group.equals(home.getGroup()))
                || (away.getGroup() != null && !group.equals(away.getGroup())))) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                    "Les équipes doivent appartenir à la poule sélectionnée.");
        }
        match.setStartsAt(startsAt);
        match.setVenue(venue);
        match.setGroup(group);
        match.setHomeTeam(home);
        match.setAwayTeam(away);
    }

    private Match requireAssignedMatch(UUID matchId, UUID managerId) {
        Match match = requireMatch(matchId, championatService.getConfiguredChampionatId());
        if (match.getAssignedManagers().stream().noneMatch(manager -> manager.getId().equals(managerId))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Le gestionnaire n'est pas affecté à ce match.");
        }
        return match;
    }

    private Match requireAssignedMatchForUpdate(UUID matchId, UUID managerId) {
        Match match = requireMatchForUpdate(matchId, championatService.getConfiguredChampionatId());
        if (match.getAssignedManagers().stream().noneMatch(manager -> manager.getId().equals(managerId))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Le gestionnaire n'est pas affecté à ce match.");
        }
        return match;
    }

    private Match requireMatch(UUID matchId, UUID championshipId) {
        return matchRepository.findByIdAndChampionship_Id(matchId, championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match introuvable."));
    }

    private Match requireMatchForUpdate(UUID matchId, UUID championshipId) {
        return matchRepository.findForUpdate(matchId, championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match introuvable."));
    }

    private Championat requireChampionship(UUID id) {
        return championatRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Championnat introuvable."));
    }

    private Equipe requireTeam(UUID teamId, UUID championshipId) {
        return equipeRepository.findByIdAndChampionship_IdAndActiveTrue(teamId, championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Équipe invalide."));
    }

    private Equipe requireParticipantTeam(Match match, UUID teamId) {
        if (teamId.equals(match.getHomeTeam().getId())) return match.getHomeTeam();
        if (teamId.equals(match.getAwayTeam().getId())) return match.getAwayTeam();
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "L'équipe ne participe pas à ce match.");
    }

    private Player requireTeamPlayer(UUID playerId, Equipe team) {
        if (team == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "L'équipe doit être précisée pour le joueur.");
        }
        Player player = playerRepository.findByIdAndActiveTrue(playerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Joueur invalide."));
        if (!player.getEquipe().getId().equals(team.getId())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Le joueur n'appartient pas à cette équipe.");
        }
        return player;
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private boolean sameId(com.tikiscore_server.common.Entity entity, UUID id) {
        return entity == null ? id == null : entity.getId().equals(id);
    }

    private boolean isScoreEvent(MatchEventType type) {
        return type == MatchEventType.GOAL || type == MatchEventType.OWN_GOAL
                || type == MatchEventType.PENALTY_GOAL || type == MatchEventType.SCORE_CORRECTION;
    }

    private boolean isLifecycleEvent(MatchEventType type) {
        return type == MatchEventType.MATCH_STARTED || type == MatchEventType.MATCH_PAUSED
                || type == MatchEventType.MATCH_RESUMED || type == MatchEventType.HALF_TIME_STARTED
                || type == MatchEventType.SECOND_HALF_STARTED || type == MatchEventType.MATCH_ENDED
                || type == MatchEventType.MATCH_POSTPONED || type == MatchEventType.MATCH_CANCELLED;
    }
}