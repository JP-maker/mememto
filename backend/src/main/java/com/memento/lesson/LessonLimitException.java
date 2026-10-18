package com.memento.lesson;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/** Le compte a atteint le nombre maximal de leçons. Répond 409. */
@ResponseStatus(HttpStatus.CONFLICT)
public class LessonLimitException extends RuntimeException {
}
