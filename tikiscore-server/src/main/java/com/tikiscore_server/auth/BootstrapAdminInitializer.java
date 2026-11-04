package com.tikiscore_server.auth;

import com.tikiscore_server.role.Role;
import com.tikiscore_server.role.RoleName;
import com.tikiscore_server.role.RoleRepository;
import com.tikiscore_server.user.User;
import com.tikiscore_server.user.UserRepository;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class BootstrapAdminInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final String configuredUsername;

    public BootstrapAdminInitializer(
            UserRepository userRepository,
            RoleRepository roleRepository,
            @Value("${TIKISCORE_SYSTEM_ADMIN_USERNAME:}") String configuredUsername
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.configuredUsername = configuredUsername;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        boolean adminExists = userRepository.findAll().stream()
                .flatMap(user -> user.getRoles().stream())
            .anyMatch(role -> role.getName() == RoleName.SYSTEM_ADMIN);
        if (adminExists) return;
        if (configuredUsername.isBlank()) return;

        String username = configuredUsername.strip().toLowerCase(Locale.ROOT);
        User user = userRepository.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new IllegalStateException(
                "The configured system administrator account must already exist."));
        Role systemAdminRole = roleRepository.findByName(RoleName.SYSTEM_ADMIN)
            .orElseThrow(() -> new IllegalStateException("Required SYSTEM_ADMIN role is missing."));
        Role userRole = roleRepository.findByName(RoleName.USER)
            .orElseThrow(() -> new IllegalStateException("Required USER role is missing."));
        user.getRoles().add(systemAdminRole);
        user.getRoles().add(userRole);
        userRepository.save(user);
    }
}