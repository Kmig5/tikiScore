
package com.tikiscore_server.role;

/**
 *
 * @author Miguel
 */

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "roles",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_roles_name",
            columnNames = "name"
        )
    }
)
public class Role extends com.tikiscore_server.common.Entity {

    @Enumerated(EnumType.STRING)
    @Column(name = "name", nullable = false, length = 50)
    private RoleName name;

    @Column(name = "description", length = 255)
    private String description;

}