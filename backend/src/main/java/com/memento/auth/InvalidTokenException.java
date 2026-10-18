package com.memento.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/** Jeton inconnu, expiré ou déjà utilisé. Répond 400 sans préciser lequel. */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidTokenException extends RuntimeException {
}
