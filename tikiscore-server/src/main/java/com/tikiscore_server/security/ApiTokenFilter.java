package com.tikiscore_server.security;

import com.tikiscore_server.auth.SessionToken;
import com.tikiscore_server.auth.SessionTokenRepository;
import com.tikiscore_server.role.RoleName;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ApiTokenFilter extends OncePerRequestFilter {

    private final SessionTokenRepository sessionTokenRepository;

    public ApiTokenFilter(SessionTokenRepository sessionTokenRepository) {
        this.sessionTokenRepository = sessionTokenRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String tokenHash = sha256(authorization.substring(7));
            sessionTokenRepository.findFirstByAccessTokenHashAndRevokedAtIsNullAndAccessExpiresAtAfter(
                    tokenHash, Instant.now()).ifPresent(session -> authenticate(request, session));
        }
        filterChain.doFilter(request, response);
    }

    private void authenticate(HttpServletRequest request, SessionToken session) {
        Set<RoleName> roles = session.getUser().getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toUnmodifiableSet());
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                session.getUser().getId(), null, RolePermissions.authoritiesFor(roles));
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    public static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}