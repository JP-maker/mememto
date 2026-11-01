package com.mememto.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Inscription avec confirmation d'e-mail, connexion, mot de passe oublié.
 * Les réponses ne révèlent jamais si une adresse a déjà un compte.
 */
@Service
@Transactional
public class AuthService {

    static final Duration CONFIRM_TTL = Duration.ofHours(24);
    static final Duration RESET_TTL = Duration.ofHours(1);

    private final UserRepository users;
    private final OneTimeTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final MailService mail;
    private final LoginThrottle throttle;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();
    /** Empreinte factice comparée quand l'adresse est inconnue : la réponse prend le même temps. */
    private final String decoyHash;

    public AuthService(UserRepository users, OneTimeTokenRepository tokens, PasswordEncoder encoder,
                       MailService mail, LoginThrottle throttle, Clock clock) {
        this.users = users;
        this.tokens = tokens;
        this.encoder = encoder;
        this.mail = mail;
        this.throttle = throttle;
        this.clock = clock;
        this.decoyHash = encoder.encode("decoy-" + UUID.randomUUID());
    }

    /** Crée le compte (non confirmé) et envoie le lien de confirmation. Sans effet visible si l'adresse est déjà confirmée. */
    public void register(String rawEmail, String password) {
        String email = normalize(rawEmail);
        Optional<User> existing = users.findByEmail(email);
        if (existing.isPresent()) {
            User user = existing.get();
            if (!user.isEmailVerified()) {
                // Nouvelle inscription sur un compte jamais confirmé : le dernier mot de passe saisi l'emporte.
                user.setPasswordHash(encoder.encode(password));
                sendConfirmation(user);
            }
            return;
        }
        sendConfirmation(users.save(new User(email, encoder.encode(password), clock.instant())));
    }

    public void confirmEmail(String token) {
        User user = users.findById(consume(token, TokenPurpose.CONFIRM_EMAIL)).orElseThrow(InvalidTokenException::new);
        user.setEmailVerified(true);
    }

    /** Vérifie l'e-mail et le mot de passe. Un compte non confirmé ne peut pas se connecter. */
    @Transactional(readOnly = true)
    public User authenticate(String rawEmail, String password) {
        String email = normalize(rawEmail);
        if (throttle.isBlocked(email)) {
            throw new TooManyAttemptsException();
        }
        User user = users.findByEmail(email).orElse(null);
        boolean hasPassword = user != null && user.getPasswordHash() != null;
        boolean matches = encoder.matches(password, hasPassword ? user.getPasswordHash() : decoyHash);
        if (!hasPassword || !matches) {
            throttle.failure(email);
            throw new InvalidCredentialsException();
        }
        if (!user.isEmailVerified()) {
            throw new EmailNotConfirmedException();
        }
        throttle.reset(email);
        return user;
    }

    /**
     * Compte d'une personne connectée via Google / Microsoft (adresse déjà vérifiée par le fournisseur).
     * Un compte e-mail jamais confirmé est repris tel quel mais son mot de passe est effacé : celui qui
     * l'aurait créé avec l'adresse d'autrui n'y garde pas la main.
     */
    public User signInWithProvider(String rawEmail) {
        String email = normalize(rawEmail);
        User user = users.findByEmail(email).orElse(null);
        if (user == null) {
            user = new User(email, null, clock.instant());
            user.setEmailVerified(true);
            return users.save(user);
        }
        if (!user.isEmailVerified()) {
            user.setPasswordHash(null);
            user.setEmailVerified(true);
            tokens.deleteByUserId(user.getId());
        }
        return user;
    }

    /** Envoie un lien de réinitialisation si le compte existe et est confirmé ; ne dit rien sinon. */
    public void forgotPassword(String rawEmail) {
        users.findByEmail(normalize(rawEmail)).filter(User::isEmailVerified).ifPresent(user -> {
            tokens.deleteByUserIdAndPurpose(user.getId(), TokenPurpose.RESET_PASSWORD);
            mail.sendPasswordReset(user.getEmail(), issue(user, TokenPurpose.RESET_PASSWORD, RESET_TTL));
        });
    }

    public void resetPassword(String token, String newPassword) {
        User user = users.findById(consume(token, TokenPurpose.RESET_PASSWORD)).orElseThrow(InvalidTokenException::new);
        user.setPasswordHash(encoder.encode(newPassword));
        tokens.deleteByUserId(user.getId()); // aucun autre lien en attente ne reste valable
        throttle.reset(user.getEmail());
    }

    @Transactional(readOnly = true)
    public Optional<User> find(UUID id) {
        return users.findById(id);
    }

    private void sendConfirmation(User user) {
        tokens.deleteByUserIdAndPurpose(user.getId(), TokenPurpose.CONFIRM_EMAIL);
        mail.sendConfirmation(user.getEmail(), issue(user, TokenPurpose.CONFIRM_EMAIL, CONFIRM_TTL));
    }

    /** Crée un jeton, enregistre son empreinte et renvoie la valeur à envoyer par e-mail. */
    private String issue(User user, TokenPurpose purpose, Duration ttl) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokens.save(new OneTimeToken(sha256(raw), user.getId(), purpose, clock.instant().plus(ttl)));
        return raw;
    }

    /** Consomme un jeton valable : il est supprimé, donc inutilisable une seconde fois. */
    private UUID consume(String raw, TokenPurpose purpose) {
        OneTimeToken token = tokens.findById(sha256(raw)).orElseThrow(InvalidTokenException::new);
        tokens.delete(token);
        if (token.getPurpose() != purpose || clock.instant().isAfter(token.getExpiresAt())) {
            throw new InvalidTokenException();
        }
        return token.getUserId();
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(java.util.Locale.ROOT);
    }

    static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e); // SHA-256 est présent dans toute JVM
        }
    }
}
