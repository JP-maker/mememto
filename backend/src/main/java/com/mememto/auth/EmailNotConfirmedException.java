package com.mememto.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/** Mot de passe correct mais adresse e-mail pas encore confirmée. Répond 403. */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class EmailNotConfirmedException extends RuntimeException {
}
