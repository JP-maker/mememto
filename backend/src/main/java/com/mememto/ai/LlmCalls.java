package com.mememto.ai;

import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/** Traduit les erreurs HTTP d'un fournisseur en erreurs de l'application, sans en recopier le contenu. */
final class LlmCalls {

    private static final Logger LOG = LoggerFactory.getLogger(LlmCalls.class);

    private LlmCalls() {
    }

    static <T> T run(Supplier<T> call) {
        try {
            return call.get();
        } catch (RestClientResponseException e) {
            // Le message de l'exception n'est jamais renvoyé ni journalisé : seul le code compte.
            int status = e.getStatusCode().value();
            String body = e.getResponseBodyAsString();
            // Dans le journal du serveur seulement (jamais renvoyé au navigateur), tronqué.
            LOG.warn("Fournisseur IA : réponse HTTP {} {}", status, body.length() > 300 ? body.substring(0, 300) : body);
            throw status == 401 || status == 403 ? new AiKeyRejectedException() : new AiUnavailableException();
        } catch (RestClientException e) {
            LOG.warn("Fournisseur IA injoignable ou réponse illisible ({})", e.getClass().getSimpleName());
            throw new AiUnavailableException();
        }
    }
}
