package com.mememto.ai;

/** Un fournisseur d'IA : envoie une consigne et renvoie le texte de la réponse. */
public interface LlmClient {

    AiProvider provider();

    /**
     * @param apiKey clé de l'utilisateur : utilisée pour cet appel seulement, ni stockée ni journalisée
     * @throws AiKeyRejectedException si le fournisseur refuse la clé
     * @throws AiUnavailableException si le fournisseur ne répond pas correctement
     */
    String complete(String apiKey, String system, String user);
}
