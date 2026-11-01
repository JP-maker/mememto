package com.mememto.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/** E-mail inconnu ou mot de passe faux : même réponse dans les deux cas. Répond 401. */
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class InvalidCredentialsException extends RuntimeException {
}
