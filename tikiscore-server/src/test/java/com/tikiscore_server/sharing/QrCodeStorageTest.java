package com.tikiscore_server.sharing;

import java.nio.file.Path;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class QrCodeStorageTest {

    @TempDir
    Path directory;

    @Test
    void createOnceDoesNotReplaceTheOfficialCode() throws Exception {
        FileSystemQrCodeStorage storage = new FileSystemQrCodeStorage(directory.toString());
        UUID championshipId = UUID.randomUUID();
        byte[] original = {1, 2, 3};

        storage.createOnce(championshipId, original);
        storage.createOnce(championshipId, new byte[]{4, 5, 6});

        assertTrue(storage.exists(championshipId));
        assertArrayEquals(original, storage.read(championshipId));
    }
}