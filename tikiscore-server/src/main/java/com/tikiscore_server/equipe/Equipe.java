
package com.tikiscore_server.equipe;

/**
 *
 * @author Miguel
 */

import com.tikiscore_server.championat.Championat;
import com.tikiscore_server.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.lang.annotation.Annotation;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
    name = "teams",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_team_name_championship",
            columnNames = {"name", "championship_id"}
        )
    }
)
public class Equipe implements Entity {

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "short_name", length = 20)
    private String shortName;

    @Column(name = "locality", length = 120)
    private String locality;

    @Column(name = "primary_color", length = 30)
    private String primaryColor;

    @Column(name = "secondary_color", length = 30)
    private String secondaryColor;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "championship_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_team_championship")
    )
    private Championat championship;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "manager_id",
        foreignKey = @ForeignKey(name = "fk_team_manager")
    )
    private User manager;

    @Override
    public String name() {
        throw new UnsupportedOperationException("Not supported yet."); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/GeneratedMethodBody
    }

    @Override
    public Class<? extends Annotation> annotationType() {
        throw new UnsupportedOperationException("Not supported yet."); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/GeneratedMethodBody
    }
}