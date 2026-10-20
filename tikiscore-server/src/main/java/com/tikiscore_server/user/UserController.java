package com.tikiscore_server.user;

import com.tikiscore_server.auth.AuthService;
import com.tikiscore_server.auth.dto.AuthenticatedUserResponse;
import com.tikiscore_server.auth.dto.PasswordChangeRequest;
import com.tikiscore_server.auth.dto.ProfileUpdateRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class UserController {

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping({"/auth/me", "/users/me"})
    @PreAuthorize("hasAuthority('PERM_PROFILE_READ')")
    public AuthenticatedUserResponse currentUser(Authentication authentication) {
        return authService.currentUser(userId(authentication));
    }

    @PatchMapping("/users/me")
    @PreAuthorize("hasAuthority('PERM_PROFILE_UPDATE')")
    public AuthenticatedUserResponse updateProfile(
            Authentication authentication,
            @Valid @RequestBody ProfileUpdateRequest request
    ) {
        return authService.updateProfile(userId(authentication), request);
    }

    @PatchMapping("/users/me/password")
    @PreAuthorize("hasAuthority('PERM_PROFILE_UPDATE')")
    public ResponseEntity<Void> changePassword(
            Authentication authentication,
            @Valid @RequestBody PasswordChangeRequest request
    ) {
        authService.changePassword(userId(authentication), request);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    private UUID userId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }
}