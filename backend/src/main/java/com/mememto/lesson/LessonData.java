package com.mememto.lesson;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

/**
 * Contenu d'une leçon tel que l'envoie et le lit le front. Chaque champ est borné :
 * l'API refuse tout ce qui ne ressemble pas à une leçon Mememto.
 */
public record LessonData(
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(max = 20_000) String text,
        @NotNull @Pattern(regexp = "ACTIVE_RECALL|SPACED_REPETITION|FEYNMAN") String method,
        @NotNull @Pattern(regexp = DATE) String deadline,
        @Min(5) @Max(240) int minutesPerDay,
        @NotNull @Size(max = 400) List<@Valid PlanDay> plan,
        @Size(max = 400) List<@Pattern(regexp = DATE) String> done,
        @Size(max = 2_000) Map<@Pattern(regexp = "\\d{1,5}") String, @Size(max = 40) String> progress) {

    static final String DATE = "\\d{4}-\\d{2}-\\d{2}";

    /** Un jour du plan : mêmes valeurs que celles renvoyées par /api/plan. */
    public record PlanDay(
            @NotNull @Pattern(regexp = DATE) String date,
            @NotNull @Pattern(regexp = "LEARN|REVIEW|REST|FINAL") String type,
            @Min(0) @Max(240) int minutes) {
    }
}
