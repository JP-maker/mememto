package com.memento.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/** Trop d'échecs de connexion récents pour cette adresse. Répond 429. */
@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
public class TooManyAttemptsException extends RuntimeException {
}
