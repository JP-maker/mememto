package com.mememto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Une phrase de la leçon préparée par l'IA : le mot à cacher, trois faux choix et des mots clés.
 * Sert aussi de format de stockage dans la leçon, d'où les bornes.
 */
public record PreparedItem(
        @NotBlank @Size(max = 600) String sentence,
        @NotBlank @Size(max = 60) String answer,
        @Size(max = 3) List<@Size(max = 40) String> keywords,
        @Size(max = 3) List<@Size(max = 60) String> distractors) {
}
