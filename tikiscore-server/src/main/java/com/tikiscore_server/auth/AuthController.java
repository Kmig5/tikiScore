package com.tikiscore_server.auth;

import com.tikiscore_server.auth.dto.LoginRequest;
import com.tikiscore_server.auth.dto.RegisterRequest;
import com.tikiscore_server.auth.dto.TokenResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.Duration;
import java.util.Arrays;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    static final String REFRESH_COOKIE = "TIKISCORE_REFRESH";
    private static final String REFRESH_COOKIE_PATH = "/api/auth";

    private final AuthService authService;
    private final boolean secureCookie;
    private final Duration refreshTokenLifetime;

    public AuthController(
            AuthService authService,
            @Value("${TIKISCORE_COOKIE_SECURE:false}") boolean secureCookie,
            @Value("${TIKISCORE_REFRESH_TOKEN_DAYS:14}") long refreshTokenDays
    ) {
        this.authService = authService;
        this.secureCookie = secureCookie;
        this.refreshTokenLifetime = Duration.ofDays(refreshTokenDays);
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken csrfToken) {
        return Map.of("token", csrfToken.getToken(), "headerName", csrfToken.getHeaderName());
    }

    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        return issue(authService.register(request), HttpStatus.CREATED, response);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        return issue(authService.login(request), HttpStatus.OK, response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        return issue(authService.refresh(readRefreshCookie(request)), HttpStatus.OK, response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(readRefreshCookieOrNull(request));
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie("", Duration.ZERO).toString());
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<TokenResponse> issue(
            AuthService.IssuedSession session,
            HttpStatus status,
            HttpServletResponse response
    ) {
        response.addHeader(HttpHeaders.SET_COOKIE,
                refreshCookie(session.refreshToken(), refreshTokenLifetime).toString());
        return ResponseEntity.status(status).body(session.response());
    }

    private ResponseCookie refreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(secureCookie)
                .path(REFRESH_COOKIE_PATH)
                .sameSite("Lax")
                .maxAge(maxAge)
                .build();
    }

    private String readRefreshCookie(HttpServletRequest request) {
        String token = readRefreshCookieOrNull(request);
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session de renouvellement absente.");
        }
        return token;
    }

    private String readRefreshCookieOrNull(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        return Arrays.stream(cookies)
                .filter(cookie -> REFRESH_COOKIE.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}