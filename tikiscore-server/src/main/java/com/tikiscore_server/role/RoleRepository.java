package com.tikiscore_server.role;

import java.util.Optional;
import java.util.UUID;
import java.util.List;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByName(RoleName name);

    boolean existsByName(RoleName name);

    List<Role> findAllByNameIn(Set<RoleName> names);
}