package com.memento.auth;

import java.util.Map;
import java.util.Optional;

/**
 * Décide si Google ou Microsoft garantit l'adresse e-mail reçue. On ne crée ni ne rattache jamais
 * un compte à une adresse que le fournisseur n'a pas vérifiée : sinon quelqu'un pourrait se faire
 * passer pour le propriétaire d'une adresse (faille connue sous le nom « nOAuth »).
 */
final class OAuthIdentity {

    /** Identifiant de tenant des comptes Microsoft personnels (Outlook, Hotmail…). Valeur publique et fixe. */
    static final String MICROSOFT_PERSONAL_TENANT = "9188040d-6c67-4c5b-b112-36a304b66dad";

    private OAuthIdentity() {
    }

    static Optional<String> verifiedEmail(String provider, Map<String, Object> claims) {
        Object email = claims.get("email");
        if (!(email instanceof String address) || address.isBlank()) {
            return Optional.empty();
        }
        boolean verified = switch (provider) {
            // Google indique lui-même si l'adresse est vérifiée.
            case "google" -> Boolean.TRUE.equals(claims.get("email_verified"));
            // Microsoft ne l'indique pas : seule l'adresse d'un compte personnel est garantie par Microsoft.
            case "microsoft" -> MICROSOFT_PERSONAL_TENANT.equals(claims.get("tid"));
            default -> false;
        };
        return verified ? Optional.of(address) : Optional.empty();
    }
}
