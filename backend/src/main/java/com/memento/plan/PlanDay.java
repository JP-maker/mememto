package com.memento.plan;

import java.time.LocalDate;

/** Un jour du plan de travail. {@code minutes} vaut 0 les jours de repos. */
public record PlanDay(LocalDate date, SessionType type, int minutes) {
}
