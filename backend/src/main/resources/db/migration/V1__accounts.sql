-- Comptes utilisateurs. password_hash est vide pour un compte créé via Google/Microsoft (à venir).
CREATE TABLE users (
    id             UUID PRIMARY KEY,
    email          VARCHAR(254) NOT NULL UNIQUE,   -- toujours en minuscules
    password_hash  VARCHAR(255),
    email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ  NOT NULL
);

-- Jetons à usage unique (confirmation d'e-mail, réinitialisation). Seul le hash SHA-256 est stocké :
-- une fuite de la base ne donne pas de lien utilisable.
CREATE TABLE one_time_tokens (
    token_hash VARCHAR(64) PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    purpose    VARCHAR(20) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX one_time_tokens_user_idx ON one_time_tokens (user_id, purpose);
