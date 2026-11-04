package com.tikiscore_server.user;

import com.tikiscore_server.audit.AuditService;
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
            RoleName.USER, RoleName.MATCH_MANAGER, RoleName.COMPETITION_ADMIN, RoleName.FORUM_MODERATOR);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditService auditService;

    public AdminUserService(UserRepository userRepository, RoleRepository roleRepository, AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers() {
        return userRepository.findAll().stream().map(AdminUserResponse::from).toList();
    }

    @Transactional
    public AdminUserResponse assignRoles(UUID targetUserId, UUID actorId, RoleAssignmentRequest request) {
        if (!MANAGEABLE_ROLES.containsAll(request.roles())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "La liste contient un rôle non gérable.");
        }
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));
        Set<RoleName> requestedRoles = new java.util.HashSet<>(request.roles());
        requestedRoles.add(RoleName.USER);
        target.getRoles().stream().map(Role::getName)
            .filter(roleName -> !MANAGEABLE_ROLES.contains(roleName))
            .forEach(requestedRoles::add);
        ensureBootstrapRoleAvailable(target, requestedRoles);
        List<Role> roles = roleRepository.findAllByNameIn(requestedRoles);
        if (roles.size() != requestedRoles.size()) {
            throw new IllegalStateException("A required role is missing from the role catalog.");
        }
        target.getRoles().clear();
        target.getRoles().addAll(roles);
        auditService.record(actorId, "USER_ROLES_ASSIGNED", "User", targetUserId,
                "roles=" + requestedRoles.stream().map(Enum::name).sorted().toList());
        return AdminUserResponse.from(userRepository.save(target));
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

    private void ensureBootstrapRoleAvailable(User target, Set<RoleName> requestedRoles) {
        boolean targetIsAdmin = target.getRoles().stream().anyMatch(role -> role.getName() == RoleName.COMPETITION_ADMIN
            || role.getName() == RoleName.ADMIN || role.getName() == RoleName.ORGANISATEUR);
        boolean keepsAdmin = requestedRoles.contains(RoleName.COMPETITION_ADMIN)
            || requestedRoles.contains(RoleName.ADMIN) || requestedRoles.contains(RoleName.ORGANISATEUR);
        boolean removingAdmin = targetIsAdmin && !keepsAdmin;
        if (!removingAdmin) return;
        boolean anotherAdminExists = userRepository.findAll().stream()
                .filter(user -> !user.getId().equals(target.getId()))
                .flatMap(user -> user.getRoles().stream())
                .anyMatch(role -> role.getName() == RoleName.COMPETITION_ADMIN
                    || role.getName() == RoleName.ADMIN || role.getName() == RoleName.ORGANISATEUR);
        if (!anotherAdminExists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Le dernier administrateur de compétition ne peut pas perdre son rôle.");
        }
    }
}