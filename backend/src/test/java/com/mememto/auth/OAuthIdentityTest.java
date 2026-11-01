package com.mememto.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class OAuthIdentityTest {

    @Test
    void googleEmailMustBeVerifiedByGoogle() {
        assertEquals(Optional.of("jp@gmail.com"),
            OAuthIdentity.verifiedEmail("google", Map.of("email", "jp@gmail.com", "email_verified", true)));
        assertTrue(OAuthIdentity.verifiedEmail("google", Map.of("email", "jp@gmail.com", "email_verified", false)).isEmpty());
        assertTrue(OAuthIdentity.verifiedEmail("google", Map.of("email", "jp@gmail.com")).isEmpty());
    }

    @Test
    void microsoftEmailIsTrustedOnlyForPersonalAccounts() {
        assertEquals(Optional.of("jp@outlook.fr"),
            OAuthIdentity.verifiedEmail("microsoft", Map.of("email", "jp@outlook.fr", "tid", OAuthIdentity.MICROSOFT_PERSONAL_TENANT)));
        // Compte professionnel : n'importe quel administrateur de tenant peut y écrire l'e-mail de son choix.
        assertTrue(OAuthIdentity.verifiedEmail("microsoft", Map.of("email", "pdg@mememto.fr", "tid", "autre-tenant")).isEmpty());
        assertTrue(OAuthIdentity.verifiedEmail("microsoft", Map.of("email", "pdg@mememto.fr")).isEmpty());
    }

    @Test
    void missingEmailOrUnknownProviderIsRefused() {
        assertTrue(OAuthIdentity.verifiedEmail("google", Map.of("email_verified", true)).isEmpty());
        assertTrue(OAuthIdentity.verifiedEmail("inconnu", Map.of("email", "a@b.fr", "email_verified", true)).isEmpty());
    }
}
