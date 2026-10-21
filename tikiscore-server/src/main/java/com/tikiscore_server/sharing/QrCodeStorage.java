package com.tikiscore_server.sharing;

import java.io.IOException;
import java.util.UUID;

public interface QrCodeStorage {

    boolean exists(UUID championshipId) throws IOException;

    byte[] read(UUID championshipId) throws IOException;

    void createOnce(UUID championshipId, byte[] content) throws IOException;
}