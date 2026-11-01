package com.mememto.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Limite les essais de mot de passe : {@value #MAX_FAILURES} échecs en {@code WINDOW} bloquent l'adresse.
 * Compteur en mémoire : suffisant pour une seule instance, à remplacer par un stockage partagé si on en lance plusieurs.
 * Compromis assumé : quelqu'un peut bloquer 15 minutes la connexion d'une adresse qu'il vise.
 */
@Component
public class LoginThrottle {

    static final int MAX_FAILURES = 5;
    static final Duration WINDOW = Duration.ofMinutes(15);
    private static final int MAX_ENTRIES = 10_000;

    private record Attempts(int failures, Instant since) {
    }

    private final Clock clock;
    private final Map<String, Attempts> attempts = new HashMap<>();

    public LoginThrottle(Clock clock) {
        this.clock = clock;
    }

    public synchronized boolean isBlocked(String key) {
        Attempts a = attempts.get(key);
        return a != null && !expired(a) && a.failures() >= MAX_FAILURES;
    }

    public synchronized void failure(String key) {
        if (attempts.size() >= MAX_ENTRIES) {
            attempts.values().removeIf(this::expired); // évite qu'une rafale d'adresses remplisse la mémoire
        }
        Attempts a = attempts.get(key);
        attempts.put(key, a == null || expired(a) ? new Attempts(1, clock.instant()) : new Attempts(a.failures() + 1, a.since()));
    }

    public synchronized void reset(String key) {
        attempts.remove(key);
    }

    private boolean expired(Attempts a) {
        return clock.instant().isAfter(a.since().plus(WINDOW));
    }
}
