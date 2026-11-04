CREATE TABLE IF NOT EXISTS championship_memberships (
    id BINARY(16) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    user_id BINARY(16) NOT NULL,
    championship_id BINARY(16) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_championship_membership_user_championship UNIQUE (user_id, championship_id),
    CONSTRAINT fk_membership_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_membership_championship FOREIGN KEY (championship_id) REFERENCES championships (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS championship_membership_roles (
    membership_id BINARY(16) NOT NULL,
    role_id BINARY(16) NOT NULL,
    CONSTRAINT uk_championship_membership_roles UNIQUE (membership_id, role_id),
    CONSTRAINT fk_membership_role_membership FOREIGN KEY (membership_id) REFERENCES championship_memberships (id) ON DELETE CASCADE,
    CONSTRAINT fk_membership_role_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

INSERT INTO championship_memberships (id, created_at, updated_at, user_id, championship_id)
SELECT UNHEX(REPLACE(UUID(), '-', '')), CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), legacy.user_id, legacy.championship_id
FROM (
    SELECT DISTINCT u.id AS user_id, c.id AS championship_id
    FROM users u
    JOIN championships c
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE c.organizer_id = u.id
         OR r.name IN ('USER', 'COMPETITION_ADMIN', 'ADMIN', 'ORGANISATEUR', 'MATCH_MANAGER', 'FORUM_MODERATOR', 'TEAM_MANAGER')
) AS legacy
LEFT JOIN championship_memberships existing
    ON existing.user_id = legacy.user_id AND existing.championship_id = legacy.championship_id
WHERE existing.id IS NULL;

INSERT INTO championship_membership_roles (membership_id, role_id)
SELECT membership.id, role_link.role_id
FROM championship_memberships membership
JOIN user_roles role_link ON role_link.user_id = membership.user_id
JOIN roles role_record ON role_record.id = role_link.role_id
LEFT JOIN championship_membership_roles existing
    ON existing.membership_id = membership.id AND existing.role_id = role_link.role_id
WHERE existing.membership_id IS NULL
  AND role_record.name IN ('USER', 'COMPETITION_ADMIN', 'MATCH_MANAGER', 'FORUM_MODERATOR', 'TEAM_MANAGER');

INSERT INTO championship_membership_roles (membership_id, role_id)
SELECT membership.id, competition_admin.id
FROM championship_memberships membership
JOIN user_roles legacy_link ON legacy_link.user_id = membership.user_id
JOIN roles legacy_role ON legacy_role.id = legacy_link.role_id
JOIN roles competition_admin ON competition_admin.name = 'COMPETITION_ADMIN'
LEFT JOIN championship_membership_roles existing
        ON existing.membership_id = membership.id AND existing.role_id = competition_admin.id
WHERE legacy_role.name IN ('ADMIN', 'ORGANISATEUR')
    AND existing.membership_id IS NULL;

INSERT INTO championship_membership_roles (membership_id, role_id)
SELECT membership.id, role_record.id
FROM championship_memberships membership
JOIN championships championship ON championship.id = membership.championship_id
JOIN roles role_record ON role_record.name IN ('USER', 'COMPETITION_ADMIN')
LEFT JOIN championship_membership_roles existing
    ON existing.membership_id = membership.id AND existing.role_id = role_record.id
WHERE championship.organizer_id = membership.user_id
  AND existing.membership_id IS NULL;
