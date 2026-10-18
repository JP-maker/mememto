package com.memento.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Jeton à usage unique : on ne garde que son empreinte SHA-256, jamais la valeur envoyée par e-mail. */
@Entity
@Table(name = "one_time_tokens")
public class OneTimeToken {

    @Id
    @Column(name = "token_hash", length = 64)
    private String tokenHash;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TokenPurpose purpose;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    protected OneTimeToken() {
        // requis par JPA
    }

    public OneTimeToken(String tokenHash, UUID userId, TokenPurpose purpose, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.userId = userId;
        this.purpose = purpose;
        this.expiresAt = expiresAt;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public UUID getUserId() {
        return userId;
    }

    public TokenPurpose getPurpose() {
        return purpose;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }
}
