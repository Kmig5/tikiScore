package com.tikiscore_server.forum;

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
@Table(name = "forum_categories", uniqueConstraints = @UniqueConstraint(
        name = "uk_forum_category_championship_name", columnNames = {"championship_id", "name"}))
public class ForumCategory extends com.tikiscore_server.common.Entity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "championship_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_forum_category_championship"))
    private Championat championship;

    @Column(name = "name", nullable = false, length = 80)
    private String name;
}