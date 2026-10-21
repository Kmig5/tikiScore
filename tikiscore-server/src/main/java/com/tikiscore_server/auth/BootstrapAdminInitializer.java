package com.tikiscore_server.auth;

import com.tikiscore_server.role.Role;
import com.tikiscore_server.role.RoleName;
import com.tikiscore_server.role.RoleRepository;
import com.tikiscore_server.user.User;
import com.tikiscore_server.user.UserRepository;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class BootstrapAdminInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final String configuredUsername;
    private final String configuredPassword;

    public BootstrapAdminInitializer(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            @Value("${TIKISCORE_BOOTSTRAP_ADMIN_USERNAME:}") String configuredUsername,
            @Value("${TIKISCORE_BOOTSTRAP_ADMIN_PASSWORD:}") String configuredPassword
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.configuredUsername = configuredUsername;
        this.configuredPassword = configuredPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        if (configuredUsername.isBlank() && configuredPassword.isBlank()) return;
        if (configuredUsername.isBlank() || configuredPassword.length() < 12) {
            throw new IllegalStateException("Bootstrap admin configuration requires a username and a password of at least 12 characters.");
        }
        boolean adminExists = userRepository.findAll().stream()
                .flatMap(user -> user.getRoles().stream())
                .anyMatch(role -> role.getName() == RoleName.COMPETITION_ADMIN || role.getName() == RoleName.ADMIN);
        if (adminExists) return;

        String username = configuredUsername.strip().toLowerCase(Locale.ROOT);
        User user = userRepository.findByUsernameIgnoreCase(username).orElseGet(User::new);
        if (user.getId() == null) {
            user.setUsername(username);
            user.setDisplayName(username);
            user.setPasswordHash(passwordEncoder.encode(configuredPassword));
        }
        Set.of(RoleName.USER, RoleName.COMPETITION_ADMIN).stream()
                .map(roleName -> roleRepository.findByName(roleName)
                        .orElseThrow(() -> new IllegalStateException("Required role is missing.")))
                .forEach(user.getRoles()::add);
        userRepository.save(user);
    }
}