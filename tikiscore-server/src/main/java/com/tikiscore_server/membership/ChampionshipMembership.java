package com.tikiscore_server.membership;

import com.tikiscore_server.championat.Championat;
import com.tikiscore_server.role.Role;
import com.tikiscore_server.user.User;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "championship_memberships",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_championship_membership_user_championship",
                columnNames = {"user_id", "championship_id"}
        )
)
public class ChampionshipMembership extends com.tikiscore_server.common.Entity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "championship_id", nullable = false)
    private Championat championship;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "championship_membership_roles",
            joinColumns = @JoinColumn(name = "membership_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"),
            uniqueConstraints = @UniqueConstraint(
                    name = "uk_championship_membership_roles",
                    columnNames = {"membership_id", "role_id"}
            )
    )
    private Set<Role> roles = new HashSet<>();

    public ChampionshipMembership(User user, Championat championship) {
        this.user = user;
        this.championship = championship;
    }
}