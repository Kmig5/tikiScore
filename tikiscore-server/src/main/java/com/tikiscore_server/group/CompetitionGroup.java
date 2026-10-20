package com.tikiscore_server.group;

import com.tikiscore_server.championat.Championat;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
    name = "competition_groups",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_group_name_championship",
        columnNames = {"name", "championship_id"}
    )
)
public class CompetitionGroup extends com.tikiscore_server.common.Entity {

    @Column(name = "name", nullable = false, length = 80)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "championship_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_group_championship")
    )
    private Championat championship;
}