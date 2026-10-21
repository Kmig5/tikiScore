package com.tikiscore_server.role;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

@Configuration
public class RoleInitializer {

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    ApplicationRunner initializeRoles(RoleRepository roleRepository) {
        return arguments -> {
            for (RoleName roleName : RoleName.values()) {
                if (!roleRepository.existsByName(roleName)) {
                    Role role = new Role();
                    role.setName(roleName);
                    role.setDescription(roleName.name());
                    roleRepository.save(role);
                }
            }
        };
    }
}