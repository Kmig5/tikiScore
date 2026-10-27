package com.tikiscore_server.sharing;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import com.tikiscore_server.audit.AuditService;
import com.tikiscore_server.championat.ChampionatService;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ShareService {

    private final QrCodeStorage storage;
    private final AuditService auditService;
    private final ChampionatService championatService;
    private final String publicUrl;
    private final String redirectUrl;

    public ShareService(
            QrCodeStorage storage,
            AuditService auditService,
            ChampionatService championatService,
            @Value("${TIKISCORE_PUBLIC_URL:/}") String publicUrl,
            @Value("${TIKISCORE_SHARE_REDIRECT_URL:http://localhost:8080/r/championnat}") String redirectUrl
    ) {
        this.storage = storage;
        this.auditService = auditService;
        this.championatService = championatService;
        this.publicUrl = publicUrl;
        this.redirectUrl = redirectUrl;
    }

    public ShareResponse getPublicShare() {
        return new ShareResponse("TikiScore", "Suivez le championnat sur TikiScore", publicUrl, null);
    }

    public ShareResponse getAdminShare() {
        UUID championshipId = championatService.getConfiguredChampionatId();
        return new ShareResponse("TikiScore", "Accès privé au QR code officiel", publicUrl,
                storage.exists(championshipId) ? "/api/admin/competition/qr-code" : null);
    }

    public byte[] getQrCode() {
        UUID championshipId = championatService.getConfiguredChampionatId();
        try {
            if (!storage.exists(championshipId)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Le QR code officiel n'a pas encore été initialisé.");
            }
            return storage.read(championshipId);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Le QR code est indisponible.");
        }
    }

    @Transactional
    public ShareResponse initializeQrCode(UUID actorId) {
        UUID championshipId = championatService.getConfiguredChampionatId();
        try {
            if (!storage.exists(championshipId)) {
                storage.createOnce(championshipId, generatePng(redirectUrl));
                auditService.record(actorId, "OFFICIAL_QR_INITIALIZED", "Championat", championshipId, null);
            }
            return getAdminShare();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Impossible d'initialiser le QR code.");
        }
    }

    private byte[] generatePng(String content) {
        try {
            Map<EncodeHintType, Object> hints = Map.of(
                    EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H,
                    EncodeHintType.MARGIN, 4
            );
            var matrix = new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, 1024, 1024, hints);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", output);
            return output.toByteArray();
        } catch (WriterException | IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Impossible de générer le QR code.");
        }
    }
}