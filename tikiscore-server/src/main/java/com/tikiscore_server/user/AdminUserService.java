package com.tikiscore_server.user;

import com.tikiscore_server.audit.AuditService;
import com.tikiscore_server.championat.Championat;
import com.tikiscore_server.championat.ChampionatRepository;
import com.tikiscore_server.championat.ChampionatService;
import com.tikiscore_server.membership.ChampionshipMembership;
import com.tikiscore_server.membership.ChampionshipMembershipRepository;
import com.tikiscore_server.role.Role;
import com.tikiscore_server.role.RoleName;
import com.tikiscore_server.role.RoleRepository;
import com.tikiscore_server.user.dto.AdminUserResponse;
import com.tikiscore_server.user.dto.RoleAssignmentRequest;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminUserService {

    private static final Set<RoleName> MANAGEABLE_ROLES = Set.of(
            RoleName.USER, RoleName.MATCH_MANAGER, RoleName.COMPETITION_ADMIN, RoleName.FORUM_MODERATOR, RoleName.TEAM_MANAGER);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditService auditService;
        private final ChampionatService championatService;
        private final ChampionatRepository championatRepository;
        private final ChampionshipMembershipRepository membershipRepository;

        public AdminUserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            AuditService auditService,
            ChampionatService championatService,
            ChampionatRepository championatRepository,
            ChampionshipMembershipRepository membershipRepository
        ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.auditService = auditService;
        this.championatService = championatService;
        this.championatRepository = championatRepository;
        this.membershipRepository = membershipRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers() {
        UUID championshipId = championatService.getConfiguredChampionatId();
        java.util.Map<UUID, Set<String>> rolesByUser = membershipRepository.findAllByChampionship_Id(championshipId).stream()
            .collect(java.util.stream.Collectors.toMap(
                membership -> membership.getUser().getId(),
                membership -> membership.getRoles().stream().map(role -> role.getName().name())
                    .collect(java.util.stream.Collectors.toUnmodifiableSet())));
        return userRepository.findAll().stream()
            .map(user -> AdminUserResponse.from(user, rolesByUser.getOrDefault(user.getId(), Set.of())))
            .toList();
    }

    @Transactional
    public AdminUserResponse assignRoles(UUID targetUserId, UUID actorId, RoleAssignmentRequest request) {
        if (!MANAGEABLE_ROLES.containsAll(request.roles())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "La liste contient un rôle non gérable.");
        }
        UUID championshipId = championatService.getConfiguredChampionatId();
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));
        Championat championship = championatRepository.findById(championshipId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Championnat introuvable."));
        ChampionshipMembership membership = membershipRepository.findByUser_IdAndChampionship_Id(targetUserId, championshipId)
            .orElseGet(() -> new ChampionshipMembership(target, championship));
        Set<RoleName> requestedRoles = new java.util.HashSet<>(request.roles());
        requestedRoles.add(RoleName.USER);
        ensureLastChampionshipAdministratorAvailable(membership, championshipId, requestedRoles);
        List<Role> roles = roleRepository.findAllByNameIn(requestedRoles);
        if (roles.size() != requestedRoles.size()) {
            throw new IllegalStateException("A required role is missing from the role catalog.");
        }
        membership.getRoles().clear();
        membership.getRoles().addAll(roles);
        auditService.record(actorId, "USER_ROLES_ASSIGNED", "User", targetUserId,
            "championship=" + championshipId + ";roles=" + requestedRoles.stream().map(Enum::name).sorted().toList());
        membershipRepository.save(membership);
        return AdminUserResponse.from(target, requestedRoles.stream().map(Enum::name).collect(java.util.stream.Collectors.toSet()));
    }

        @Transactional
    public AdminUserResponse transferSystemAdmin(UUID targetUserId, UUID actorId) {
        User actor = userRepository.findById(actorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (actor.getRoles().stream().noneMatch(role -> role.getName() == RoleName.SYSTEM_ADMIN)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
        User target = userRepository.findById(targetUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));
        if (actorId.equals(targetUserId)) return AdminUserResponse.from(target);

        Role systemAdminRole = roleRepository.findByName(RoleName.SYSTEM_ADMIN)
            .orElseThrow(() -> new IllegalStateException("Required SYSTEM_ADMIN role is missing."));
        Role userRole = roleRepository.findByName(RoleName.USER)
            .orElseThrow(() -> new IllegalStateException("Required USER role is missing."));
        target.getRoles().add(userRole);
        target.getRoles().add(systemAdminRole);
        actor.getRoles().add(userRole);
        actor.getRoles().removeIf(role -> role.getName() == RoleName.SYSTEM_ADMIN);
        userRepository.save(target);
        userRepository.save(actor);
        auditService.record(actorId, "SYSTEM_ADMIN_TRANSFERRED", "User", targetUserId,
            "from=" + actor.getUsername() + ";to=" + target.getUsername());
        return AdminUserResponse.from(target);
        }

    private void ensureLastChampionshipAdministratorAvailable(
            ChampionshipMembership target,
            UUID championshipId,
            Set<RoleName> requestedRoles
    ) {
        boolean targetIsAdmin = target.getRoles().stream().anyMatch(role -> role.getName() == RoleName.COMPETITION_ADMIN);
        boolean keepsAdmin = requestedRoles.contains(RoleName.COMPETITION_ADMIN);
        boolean removingAdmin = targetIsAdmin && !keepsAdmin;
        if (!removingAdmin) return;
        boolean anotherAdminExists = membershipRepository.findAllByChampionship_Id(championshipId).stream()
                .filter(membership -> !membership.getId().equals(target.getId()))
                .flatMap(membership -> membership.getRoles().stream())
                .anyMatch(role -> role.getName() == RoleName.COMPETITION_ADMIN);
        if (!anotherAdminExists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Le dernier administrateur de ce championnat ne peut pas perdre son rôle.");
        }
    }
}