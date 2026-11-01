package com.mememto.ai;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/** Le fournisseur d'IA est injoignable, saturé, ou a renvoyé une réponse inutilisable. Répond 502. */
@ResponseStatus(HttpStatus.BAD_GATEWAY)
public class AiUnavailableException extends RuntimeException {
}
