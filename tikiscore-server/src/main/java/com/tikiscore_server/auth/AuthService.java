package com.tikiscore_server.auth;

import com.tikiscore_server.auth.dto.AuthenticatedUserResponse;
import com.tikiscore_server.auth.dto.LoginRequest;
import com.tikiscore_server.auth.dto.PasswordChangeRequest;
import com.tikiscore_server.auth.dto.ProfileUpdateRequest;
import com.tikiscore_server.auth.dto.RegisterRequest;
import com.tikiscore_server.auth.dto.TokenResponse;
import com.tikiscore_server.role.Role;
import com.tikiscore_server.role.RoleName;
import com.tikiscore_server.role.RoleRepository;
import com.tikiscore_server.security.ApiTokenFilter;
import com.tikiscore_server.security.Permission;
import com.tikiscore_server.security.RolePermissions;
import com.tikiscore_server.user.User;
import com.tikiscore_server.user.UserRepository;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private static final Duration ACCESS_TOKEN_LIFETIME = Duration.ofMinutes(15);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SessionTokenRepository sessionTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final Duration refreshTokenLifetime;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            SessionTokenRepository sessionTokenRepository,
            PasswordEncoder passwordEncoder,
            @Value("${TIKISCORE_REFRESH_TOKEN_DAYS:14}") long refreshTokenDays
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.sessionTokenRepository = sessionTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenLifetime = Duration.ofDays(refreshTokenDays);
    }

    @Transactional
    public IssuedSession register(RegisterRequest request) {
        String username = normalizeUsername(request.username());
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce nom d'utilisateur est déjà utilisé.");
        }

        Role userRole = roleRepository.findByName(RoleName.USER)
                .orElseThrow(() -> new IllegalStateException("Required USER role is missing"));
        User user = new User();
        user.setUsername(username);
        user.setDisplayName(request.displayName().strip());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.getRoles().add(userRole);
        userRepository.save(user);
        return createSession(user);
    }

    @Transactional
    public IssuedSession login(LoginRequest request) {
        User user = userRepository.findByUsernameIgnoreCase(request.username().strip())
                .orElseThrow(AuthService::invalidCredentials);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        return createSession(user);
    }

    @Transactional
    public IssuedSession refresh(String rawRefreshToken) {
        String tokenHash = ApiTokenFilter.sha256(rawRefreshToken);
        SessionToken session = sessionTokenRepository
                .findFirstByRefreshTokenHashAndRevokedAtIsNullAndRefreshExpiresAtAfter(tokenHash, Instant.now())
                .orElseThrow(AuthService::invalidCredentials);
        String accessToken = generateToken();
        String refreshToken = generateToken();
        session.setAccessTokenHash(ApiTokenFilter.sha256(accessToken));
        session.setRefreshTokenHash(ApiTokenFilter.sha256(refreshToken));
        session.setAccessExpiresAt(Instant.now().plus(Duration.ofMinutes(15)));
        session.setRefreshExpiresAt(Instant.now().plus(refreshTokenLifetime));
        return new IssuedSession(accessToken, refreshToken,
                session.getAccessExpiresAt(), authenticatedUser(session.getUser()));
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        sessionTokenRepository.findFirstByRefreshTokenHash(ApiTokenFilter.sha256(rawRefreshToken))
                .filter(session -> session.getRevokedAt() == null)
                .ifPresent(session -> session.setRevokedAt(Instant.now()));
    }

    @Transactional(readOnly = true)
    public AuthenticatedUserResponse currentUser(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(AuthService::notFound);
        return authenticatedUser(user);
    }

    @Transactional
    public AuthenticatedUserResponse updateProfile(UUID userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId).orElseThrow(AuthService::notFound);
        user.setDisplayName(request.displayName().strip());
        return authenticatedUser(user);
    }

    @Transactional
    public void changePassword(UUID userId, PasswordChangeRequest request) {
        User user = userRepository.findById(userId).orElseThrow(AuthService::notFound);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Le mot de passe actuel est incorrect.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        sessionTokenRepository.findAllByUser_IdAndRevokedAtIsNull(userId)
                .forEach(session -> session.setRevokedAt(Instant.now()));
    }

    private IssuedSession createSession(User user) {
        String accessToken = generateToken();
        String refreshToken = generateToken();
        Instant now = Instant.now();
        SessionToken session = new SessionToken();
        session.setUser(user);
        session.setAccessTokenHash(ApiTokenFilter.sha256(accessToken));
        session.setRefreshTokenHash(ApiTokenFilter.sha256(refreshToken));
        session.setAccessExpiresAt(now.plus(Duration.ofMinutes(15)));
        session.setRefreshExpiresAt(now.plus(refreshTokenLifetime));
        sessionTokenRepository.save(session);
        return new IssuedSession(accessToken, refreshToken,
                session.getAccessExpiresAt(), authenticatedUser(user));
    }

    private AuthenticatedUserResponse authenticatedUser(User user) {
        Set<RoleName> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toUnmodifiableSet());
        Set<String> permissionNames = RolePermissions.permissionsFor(roles).stream()
                .map(Permission::name)
                .collect(Collectors.toUnmodifiableSet());
        Set<String> roleNames = roles.stream().map(RoleName::name).collect(Collectors.toUnmodifiableSet());
        return new AuthenticatedUserResponse(user.getId(), user.getUsername(), user.getDisplayName(), roleNames, permissionNames);
    }

    private static String normalizeUsername(String username) {
        return username.strip().toLowerCase(java.util.Locale.ROOT);
    }

    private static String generateToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identifiants invalides ou session expirée.");
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable.");
    }

    public record IssuedSession(
            String accessToken,
            String refreshToken,
            Instant accessExpiresAt,
            AuthenticatedUserResponse user
    ) {
        public TokenResponse response() {
            return new TokenResponse(accessToken, "Bearer", accessExpiresAt, user);
        }
    }
}