-- Leçons d'un compte. Le contenu (texte, plan, progression) est validé par l'API puis gardé en JSON :
-- le serveur ne le requête jamais, il le range et le restitue à son propriétaire.
CREATE TABLE lessons (
    id         UUID PRIMARY KEY,
    user_id    UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title      VARCHAR(120) NOT NULL,
    data       TEXT         NOT NULL,
    updated_at TIMESTAMPTZ  NOT NULL
);
CREATE INDEX lessons_user_idx ON lessons (user_id, updated_at DESC);
