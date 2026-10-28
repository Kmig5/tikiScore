package com.tikiscore_server.sharing;

import java.io.IOException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

@RestController
public class ShareController {

    private final ShareService shareService;

    public ShareController(ShareService shareService) {
        this.shareService = shareService;
    }

    @GetMapping("/api/public/competition/share")
    public ShareResponse getPublicShare() {
        return shareService.getPublicShare();
    }

    @GetMapping("/api/admin/competition/share")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public ShareResponse getAdminShare() throws IOException {
        return shareService.getAdminShare();
    }

    @PostMapping("/api/admin/competition/share/initialize")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public ShareResponse initializeQrCode(Authentication authentication) {
        return shareService.initializeQrCode((java.util.UUID) authentication.getPrincipal());
    }

    @GetMapping("/api/admin/competition/qr-code")
    @PreAuthorize("hasAuthority('PERM_COMPETITION_MANAGE')")
    public ResponseEntity<byte[]> getQrCode() {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CACHE_CONTROL, CacheControl.noCache().getHeaderValue())
                .body(shareService.getQrCode());
    }

    @GetMapping("/r/championnat")
    public RedirectView redirectToChampionship() {
        RedirectView redirect = new RedirectView();
        redirect.setUrl(shareService.getPublicShare().publicUrl());
        redirect.setStatusCode(org.springframework.http.HttpStatus.TEMPORARY_REDIRECT);
        return redirect;
    }
}