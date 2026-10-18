package com.memento.plan;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/** La date butoir demandée ne permet pas de construire un plan. Répond 400. */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidPlanException extends RuntimeException {
    public InvalidPlanException(String message) {
        super(message);
    }
}
