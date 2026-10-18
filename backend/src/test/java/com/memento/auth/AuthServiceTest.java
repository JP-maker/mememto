package com.memento.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {

    /** Encodeur factice : on teste la logique du service, pas Argon2. */
    static class FakeEncoder implements PasswordEncoder {
        @Override
        public String encode(CharSequence raw) {
            return "hash:" + raw;
        }

        @Override
        public boolean matches(CharSequence raw, String encoded) {
            return encode(raw).equals(encoded);
        }
    }

    UserRepository users = mock(UserRepository.class);
    OneTimeTokenRepository tokens = mock(OneTimeTokenRepository.class);
    MailService mail = mock(MailService.class);
    LoginThrottleTest.MutableClock clock = new LoginThrottleTest.MutableClock();
    AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(users, tokens, new FakeEncoder(), mail, new LoginThrottle(clock), clock);
        when(users.save(any(User.class))).thenAnswer(call -> call.getArgument(0));
    }

    private User verifiedUser() {
        User user = new User("jp@memento.fr", "hash:motdepasse-solide", clock.instant());
        user.setEmailVerified(true);
        when(users.findByEmail("jp@memento.fr")).thenReturn(Optional.of(user));
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        return user;
    }

    /** Fait « circuler » le jeton comme le ferait la base : on récupère celui envoyé par mail et celui enregistré. */
    private String captureConfirmationToken(User user) {
        ArgumentCaptor<String> raw = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<OneTimeToken> saved = ArgumentCaptor.forClass(OneTimeToken.class);
        verify(mail).sendConfirmation(anyString(), raw.capture());
        verify(tokens).save(saved.capture());
        when(tokens.findById(saved.getValue().getTokenHash())).thenReturn(Optional.of(saved.getValue()));
        assertEquals(user.getId(), saved.getValue().getUserId());
        assertNotEquals(raw.getValue(), saved.getValue().getTokenHash(), "seule l'empreinte est stockée");
        return raw.getValue();
    }

    @Test
    void registerCreatesAnUnconfirmedAccountAndSendsTheLink() {
        when(users.findByEmail("jp@memento.fr")).thenReturn(Optional.empty());

        service.register("  JP@Memento.fr ", "motdepasse-solide");

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertEquals("jp@memento.fr", saved.getValue().getEmail());
        assertFalse(saved.getValue().isEmailVerified());
        assertNotEquals("motdepasse-solide", saved.getValue().getPasswordHash());
        verify(mail).sendConfirmation(anyString(), anyString());
    }

    @Test
    void registerStaysSilentWhenTheAddressIsAlreadyConfirmed() {
        verifiedUser();

        service.register("jp@memento.fr", "un-autre-mot-de-passe");

        verify(users, never()).save(any());
        verify(mail, never()).sendConfirmation(anyString(), anyString());
    }

    @Test
    void confirmingWithTheMailedTokenVerifiesTheEmail() {
        when(users.findByEmail("jp@memento.fr")).thenReturn(Optional.empty());
        service.register("jp@memento.fr", "motdepasse-solide");
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        User user = saved.getValue();
        when(users.findById(user.getId())).thenReturn(Optional.of(user));

        service.confirmEmail(captureConfirmationToken(user));

        assertTrue(user.isEmailVerified());
    }

    @Test
    void anUnknownOrExpiredTokenIsRejected() {
        when(tokens.findById(anyString())).thenReturn(Optional.empty());
        assertThrows(InvalidTokenException.class, () -> service.confirmEmail("inconnu"));

        User user = verifiedUser();
        OneTimeToken expired = new OneTimeToken(AuthService.sha256("vieux"), user.getId(),
            TokenPurpose.CONFIRM_EMAIL, clock.instant().minusSeconds(1));
        when(tokens.findById(expired.getTokenHash())).thenReturn(Optional.of(expired));
        assertThrows(InvalidTokenException.class, () -> service.confirmEmail("vieux"));
    }

    @Test
    void aConfirmationTokenCannotResetAPassword() {
        User user = verifiedUser();
        OneTimeToken token = new OneTimeToken(AuthService.sha256("jeton"), user.getId(),
            TokenPurpose.CONFIRM_EMAIL, clock.instant().plusSeconds(60));
        when(tokens.findById(token.getTokenHash())).thenReturn(Optional.of(token));

        assertThrows(InvalidTokenException.class, () -> service.resetPassword("jeton", "nouveau-mot-de-passe"));
    }

    @Test
    void authenticateAcceptsTheRightPasswordOnAConfirmedAccount() {
        User user = verifiedUser();
        assertEquals(user, service.authenticate("JP@memento.fr", "motdepasse-solide"));
    }

    @Test
    void authenticateGivesTheSameErrorForUnknownAddressAndWrongPassword() {
        verifiedUser();
        when(users.findByEmail("inconnu@memento.fr")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> service.authenticate("inconnu@memento.fr", "x"));
        assertThrows(InvalidCredentialsException.class, () -> service.authenticate("jp@memento.fr", "faux"));
    }

    @Test
    void authenticateRefusesAnUnconfirmedAccount() {
        User user = new User("jp@memento.fr", "hash:motdepasse-solide", clock.instant());
        when(users.findByEmail("jp@memento.fr")).thenReturn(Optional.of(user));

        assertThrows(EmailNotConfirmedException.class, () -> service.authenticate("jp@memento.fr", "motdepasse-solide"));
    }

    @Test
    void authenticateBlocksAfterTooManyFailures() {
        verifiedUser();
        for (int i = 0; i < LoginThrottle.MAX_FAILURES; i++) {
            assertThrows(InvalidCredentialsException.class, () -> service.authenticate("jp@memento.fr", "faux"));
        }
        // Même avec le bon mot de passe, l'adresse est bloquée jusqu'à la fin de la fenêtre.
        assertThrows(TooManyAttemptsException.class, () -> service.authenticate("jp@memento.fr", "motdepasse-solide"));
    }

    @Test
    void forgotPasswordMailsOnlyConfirmedAccounts() {
        verifiedUser();
        when(users.findByEmail("inconnu@memento.fr")).thenReturn(Optional.empty());

        service.forgotPassword("inconnu@memento.fr");
        verify(mail, never()).sendPasswordReset(anyString(), anyString());

        service.forgotPassword("jp@memento.fr");
        verify(mail).sendPasswordReset(anyString(), anyString());
    }

    @Test
    void resetPasswordReplacesTheHashAndDropsPendingTokens() {
        User user = verifiedUser();
        service.forgotPassword("jp@memento.fr");
        ArgumentCaptor<String> raw = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<OneTimeToken> saved = ArgumentCaptor.forClass(OneTimeToken.class);
        verify(mail).sendPasswordReset(anyString(), raw.capture());
        verify(tokens).save(saved.capture());
        when(tokens.findById(saved.getValue().getTokenHash())).thenReturn(Optional.of(saved.getValue()));

        service.resetPassword(raw.getValue(), "nouveau-mot-de-passe");

        assertEquals("hash:nouveau-mot-de-passe", user.getPasswordHash());
        verify(tokens).deleteByUserId(user.getId());
    }

    @Test
    void providerSignInCreatesAVerifiedAccountWithoutPassword() {
        when(users.findByEmail("jp@gmail.com")).thenReturn(Optional.empty());

        User user = service.signInWithProvider("JP@Gmail.com");

        assertEquals("jp@gmail.com", user.getEmail());
        assertTrue(user.isEmailVerified());
        assertEquals(null, user.getPasswordHash());
    }

    @Test
    void providerSignInTakesOverAnUnconfirmedAccountAndErasesItsPassword() {
        // Quelqu'un a créé le compte avec l'adresse d'autrui et son propre mot de passe, sans jamais la confirmer.
        User squatted = new User("jp@gmail.com", "hash:mot-de-passe-du-pirate", clock.instant());
        when(users.findByEmail("jp@gmail.com")).thenReturn(Optional.of(squatted));

        User user = service.signInWithProvider("jp@gmail.com");

        assertTrue(user.isEmailVerified());
        assertEquals(null, user.getPasswordHash());
        verify(tokens).deleteByUserId(squatted.getId());
    }

    @Test
    void providerSignInKeepsTheCredentialsOfAnAlreadyConfirmedAccount() {
        User user = verifiedUser();

        assertEquals(user, service.signInWithProvider("jp@memento.fr"));
        assertEquals("hash:motdepasse-solide", user.getPasswordHash());
    }
}
