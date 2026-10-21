package com.tikiscore_server.sharing;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class FileSystemQrCodeStorage implements QrCodeStorage {

    private final Path directory;

    public FileSystemQrCodeStorage(@Value("${TIKISCORE_QR_STORAGE_DIR:./data/share}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    @Override
    public boolean exists(UUID championshipId) {
        return Files.isRegularFile(pathFor(championshipId));
    }

    @Override
    public byte[] read(UUID championshipId) throws IOException {
        return Files.readAllBytes(pathFor(championshipId));
    }

    @Override
    public void createOnce(UUID championshipId, byte[] content) throws IOException {
        Files.createDirectories(directory);
        try {
            Files.write(pathFor(championshipId), content, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
        } catch (java.nio.file.FileAlreadyExistsException ignored) {
        }
    }

    private Path pathFor(UUID championshipId) {
        return directory.resolve("championship-" + championshipId + ".png");
    }
}