package com.tikiscore_server.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.tikiscore_server.auth.SessionToken;
import com.tikiscore_server.auth.SessionTokenRepository;
import com.tikiscore_server.championat.Championat;
import com.tikiscore_server.membership.ChampionshipMembership;
import com.tikiscore_server.membership.ChampionshipMembershipRepository;
import com.tikiscore_server.role.Role;
import com.tikiscore_server.role.RoleName;
import com.tikiscore_server.user.User;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.security.core.context.SecurityContextHolder;

class ApiTokenFilterTest {

    private final SessionTokenRepository sessionRepository = mock(SessionTokenRepository.class);
    private final ChampionshipMembershipRepository membershipRepository = mock(ChampionshipMembershipRepository.class);
    private final ApiTokenFilter filter = new ApiTokenFilter(sessionRepository, membershipRepository);

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void competitionAdminPermissionIsResolvedOnlyForTheSelectedChampionship() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID administeredChampionshipId = UUID.randomUUID();
        UUID otherChampionshipId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.getRoles().add(new Role(RoleName.USER, "Utilisateur"));
        SessionToken session = new SessionToken();
        session.setUser(user);
        when(sessionRepository.findFirstByAccessTokenHashAndRevokedAtIsNullAndAccessExpiresAtAfter(
                eq(ApiTokenFilter.sha256("test-token")), any(Instant.class))).thenReturn(Optional.of(session));

        ChampionshipMembership adminMembership = membership(user, administeredChampionshipId,
                RoleName.USER, RoleName.COMPETITION_ADMIN);
        ChampionshipMembership otherMembership = membership(user, otherChampionshipId, RoleName.USER);
        when(membershipRepository.findByUser_IdAndChampionship_Id(userId, administeredChampionshipId))
                .thenReturn(Optional.of(adminMembership));
        when(membershipRepository.findByUser_IdAndChampionship_Id(userId, otherChampionshipId))
                .thenReturn(Optional.of(otherMembership));

        assertTrue(authoritiesFor(administeredChampionshipId).contains("PERM_COMPETITION_MANAGE"));
        SecurityContextHolder.clearContext();
        assertFalse(authoritiesFor(otherChampionshipId).contains("PERM_COMPETITION_MANAGE"));
    }

    private java.util.Set<String> authoritiesFor(UUID championshipId) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer test-token");
        request.addHeader("X-Championship-Id", championshipId.toString());
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .collect(java.util.stream.Collectors.toSet());
    }

    private ChampionshipMembership membership(User user, UUID championshipId, RoleName... roles) {
        Championat championship = new Championat();
        championship.setId(championshipId);
        ChampionshipMembership membership = new ChampionshipMembership(user, championship);
        for (RoleName role : roles) membership.getRoles().add(new Role(role, role.name()));
        return membership;
    }
}