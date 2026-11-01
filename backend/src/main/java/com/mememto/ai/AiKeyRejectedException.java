package com.mememto.ai;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/** Le fournisseur d'IA a refusé la clé fournie. Répond 422. */
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class AiKeyRejectedException extends RuntimeException {
}
