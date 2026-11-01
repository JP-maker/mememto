package com.mememto.lesson;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/** Leçon inconnue, ou appartenant à un autre compte (même réponse : on ne révèle pas son existence). Répond 404. */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class LessonNotFoundException extends RuntimeException {
}
