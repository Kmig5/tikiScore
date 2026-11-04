package com.tikiscore_server.championat;

import com.tikiscore_server.championat.dto.ChampionatResponse;
import com.tikiscore_server.championat.dto.CreateChampionatRequest;
import com.tikiscore_server.championat.dto.UpdateChampionatRequest;
import com.tikiscore_server.championat.enums.ChampionatStatus;
import com.tikiscore_server.membership.ChampionshipMembership;
import com.tikiscore_server.membership.ChampionshipMembershipRepository;
import com.tikiscore_server.equipe.EquipeRepository;
import com.tikiscore_server.match.MatchRepository;
import com.tikiscore_server.role.Role;
import com.tikiscore_server.role.RoleName;
import com.tikiscore_server.role.RoleRepository;
import com.tikiscore_server.user.User;
import com.tikiscore_server.user.UserRepository;
import java.util.List;
import java.util.UUID;
import java.time.ZoneId;
import java.time.DateTimeException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class ChampionatService {

    private static final List<ChampionatStatus> PUBLIC_STATUSES = List.of(
            ChampionatStatus.INSCRIPTION_OUVERTE,
            ChampionatStatus.EN_COURS,
            ChampionatStatus.TERMINÉ
    );

    private final ChampionatRepository championatRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ChampionshipMembershipRepository membershipRepository;
    private final EquipeRepository equipeRepository;
    private final MatchRepository matchRepository;
    private final String publicUrl;

    public ChampionatService(
            ChampionatRepository championatRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            ChampionshipMembershipRepository membershipRepository,
            EquipeRepository equipeRepository,
            MatchRepository matchRepository,
            @Value("${TIKISCORE_PUBLIC_URL:/}") String publicUrl
    ) {
        this.championatRepository = championatRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.membershipRepository = membershipRepository;
        this.equipeRepository = equipeRepository;
        this.matchRepository = matchRepository;
        this.publicUrl = publicUrl;
    }

    public ChampionatResponse getPublicChampionat() {
        return ChampionatResponse.from(requirePublicChampionat(), publicUrl);
    }

    public List<ChampionatResponse> getPublicChampionnats() {
        return championatRepository.findAllByStatusInOrderByStartDateAsc(PUBLIC_STATUSES).stream()
                .map(championat -> ChampionatResponse.from(championat, publicUrl))
                .toList();
    }

    public UUID getPublicChampionatId() {
        return requirePublicChampionat().getId();
    }

    private Championat requirePublicChampionat() {
        UUID requestedId = requestedChampionshipId();
        if (requestedId != null) {
            Championat requested = championatRepository.findById(requestedId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Championnat introuvable."));
            if (!PUBLIC_STATUSES.contains(requested.getStatus())) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ce championnat n'est pas public.");
            }
            return requested;
        }
        List<Championat> publicChampionnats = championatRepository
                .findAllByStatusInOrderByStartDateAsc(PUBLIC_STATUSES);
        if (publicChampionnats.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Aucun championnat public n'est configuré.");
        }
        if (publicChampionnats.size() > 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Plusieurs championnats publics sont configurés.");
        }
        return publicChampionnats.getFirst();
    }

    public ChampionatResponse getAdminChampionat() {
        return ChampionatResponse.from(requireConfiguredChampionat(), publicUrl);
    }

    public UUID getConfiguredChampionatId() {
        return requireConfiguredChampionat().getId();
    }

    @Transactional
    public ChampionatResponse createChampionat(UUID organizerId, CreateChampionatRequest request) {
        validateDateRange(request.startDate(), request.endDate());
        int pointsForWin = request.pointsForWin() == null ? 3 : request.pointsForWin();
        int pointsForDraw = request.pointsForDraw() == null ? 1 : request.pointsForDraw();
        int pointsForLoss = request.pointsForLoss() == null ? 0 : request.pointsForLoss();
        validateScoring(pointsForWin, pointsForDraw, pointsForLoss);
        String timeZone = validateTimeZone(request.timeZone());
        if (championatRepository.existsBySlugIgnoreCase(request.slug())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce slug de championnat est déjà utilisé.");
        }
        User organizer = userRepository.findById(organizerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        Championat championat = new Championat();
        championat.setName(request.name().trim());
        championat.setSlug(request.slug());
        championat.setEdition(request.edition());
        championat.setDescription(request.description());
        championat.setLocalite(request.locality());
        championat.setStartDate(request.startDate());
        championat.setEndDate(request.endDate());
        championat.setFormat(request.format());
        championat.setStatus(ChampionatStatus.BROUILLON);
        championat.setForumPublic(request.forumPublic() == null || request.forumPublic());
        championat.setPointsForWin(pointsForWin);
        championat.setPointsForDraw(pointsForDraw);
        championat.setPointsForLoss(pointsForLoss);
        championat.setTimeZone(timeZone);
        championat.setOrganisateur(organizer);
        Role competitionAdminRole = roleRepository.findByName(RoleName.COMPETITION_ADMIN)
            .orElseThrow(() -> new IllegalStateException("Required COMPETITION_ADMIN role is missing."));
        Role userRole = roleRepository.findByName(RoleName.USER)
            .orElseThrow(() -> new IllegalStateException("Required USER role is missing."));
        Championat savedChampionat = championatRepository.save(championat);
        ChampionshipMembership membership = new ChampionshipMembership(organizer, championat);
        membership.getRoles().add(userRole);
        membership.getRoles().add(competitionAdminRole);
        membershipRepository.save(membership);
        return ChampionatResponse.from(savedChampionat, publicUrl);
    }

    @Transactional
    public ChampionatResponse updateChampionat(UpdateChampionatRequest request) {
        Championat championat = requireConfiguredChampionat();
        String slug = request.slug() == null ? championat.getSlug() : request.slug();
        if (!slug.equalsIgnoreCase(championat.getSlug()) && championatRepository.existsBySlugIgnoreCase(slug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce slug de championnat est déjà utilisé.");
        }
        java.time.LocalDate startDate = request.startDate() == null
                ? championat.getStartDate() : request.startDate();
        java.time.LocalDate endDate = request.endDate() == null
                ? championat.getEndDate() : request.endDate();
        validateDateRange(startDate, endDate);
        Integer pointsForWin = request.pointsForWin() == null ? championat.getPointsForWin() : request.pointsForWin();
        Integer pointsForDraw = request.pointsForDraw() == null ? championat.getPointsForDraw() : request.pointsForDraw();
        Integer pointsForLoss = request.pointsForLoss() == null ? championat.getPointsForLoss() : request.pointsForLoss();
        validateScoring(pointsForWin, pointsForDraw, pointsForLoss);
        String timeZone = request.timeZone() == null ? championat.getTimeZone() : validateTimeZone(request.timeZone());

        if (request.name() != null) championat.setName(request.name().trim());
        championat.setSlug(slug);
        if (request.edition() != null) championat.setEdition(request.edition());
        if (request.description() != null) championat.setDescription(request.description());
        if (request.locality() != null) championat.setLocalite(request.locality());
        championat.setStartDate(startDate);
        championat.setEndDate(endDate);
        if (request.format() != null) championat.setFormat(request.format());
        if (request.forumPublic() != null) championat.setForumPublic(request.forumPublic());
        championat.setPointsForWin(pointsForWin);
        championat.setPointsForDraw(pointsForDraw);
        championat.setPointsForLoss(pointsForLoss);
        championat.setTimeZone(timeZone);
        return ChampionatResponse.from(championatRepository.save(championat), publicUrl);
    }

    @Transactional
    public ChampionatResponse publishChampionat() {
        Championat championat = requireConfiguredChampionat();
        if (championat.getStatus() != ChampionatStatus.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seul un brouillon peut être publié.");
        }
        UUID championshipId = championat.getId();
        if (equipeRepository.findAllByChampionship_IdAndActiveTrue(championshipId).size() < 2) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                    "Ajoutez au moins deux équipes avant l’activation.");
        }
        if (matchRepository.findAllByChampionship_IdOrderByStartsAtAsc(championshipId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                    "Programmez au moins une rencontre avant l’activation.");
        }
        championat.setStatus(ChampionatStatus.EN_COURS);
        return ChampionatResponse.from(championatRepository.save(championat), publicUrl);
    }

    private Championat requireConfiguredChampionat() {
        UUID requestedId = requestedChampionshipId();
        if (requestedId != null) {
            return championatRepository.findById(requestedId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Championnat introuvable."));
        }
        return requireSingleChampionat(championatRepository.findAll());
    }

    private UUID requestedChampionshipId() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) return null;
        String header = attributes.getRequest().getHeader("X-Championship-Id");
        if (header == null || header.isBlank()) return null;
        try {
            return UUID.fromString(header);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identifiant de championnat invalide.");
        }
    }

    private Championat requireSingleChampionat(List<Championat> championnats) {
        if (championnats.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Aucun championnat n'est configuré.");
        }
        if (championnats.size() > 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Plusieurs championnats sont configurés.");
        }
        return championnats.getFirst();
    }

    private void validateDateRange(java.time.LocalDate startDate, java.time.LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                    "La date de fin doit être postérieure ou égale à la date de début.");
        }
    }

    private void validateScoring(int pointsForWin, int pointsForDraw, int pointsForLoss) {
        if (pointsForWin < pointsForDraw || pointsForDraw < pointsForLoss) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                    "Les points doivent respecter victoire >= nul >= défaite.");
        }
    }

    private String validateTimeZone(String timeZone) {
        String requested = timeZone == null || timeZone.isBlank() ? "UTC" : timeZone.trim();
        try {
            return ZoneId.of(requested).getId();
        } catch (DateTimeException exception) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Fuseau horaire inconnu.");
        }
    }
}