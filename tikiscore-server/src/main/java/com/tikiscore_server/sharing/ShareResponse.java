package com.tikiscore_server.sharing;

public record ShareResponse(String title, String message, String publicUrl, String qrCodeUrl) {
}