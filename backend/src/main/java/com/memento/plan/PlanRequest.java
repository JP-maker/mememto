package com.memento.plan;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/** Données envoyées par le client pour obtenir un plan. */
public record PlanRequest(
        @NotNull LocalDate deadline,
        @Min(5) @Max(240) int minutesPerDay) {
}
