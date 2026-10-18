package com.memento.lesson;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import java.util.UUID;

/** Leçon renvoyée au front : l'identifiant, puis les champs de {@link LessonData} à plat. */
public record LessonView(UUID id, @JsonUnwrapped LessonData lesson) {
}
