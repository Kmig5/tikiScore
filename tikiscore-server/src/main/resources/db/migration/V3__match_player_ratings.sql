CREATE TABLE IF NOT EXISTS match_player_ratings (
    id BINARY(16) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    match_id BINARY(16) NOT NULL,
    player_id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    score TINYINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_match_player_rating_voter UNIQUE (match_id, player_id, user_id),
    CONSTRAINT ck_match_player_rating_score CHECK (score BETWEEN 1 AND 5),
    CONSTRAINT fk_match_player_rating_match FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE,
    CONSTRAINT fk_match_player_rating_player FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
    CONSTRAINT fk_match_player_rating_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX ix_match_player_rating_match (match_id),
    INDEX ix_match_player_rating_voter (match_id, user_id)
);