package com.mememto.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Préparation d'une leçon avec l'IA de l'utilisateur. La clé traverse le serveur sans y rester. */
@RestController
@RequestMapping("/api/prepare")
public class AiController {

    /** La clé est masquée dans toString : aucune trace possible si l'objet finit dans un journal. */
    record PrepareRequest(
            @NotNull AiProvider provider,
            @NotBlank @Size(min = 10, max = 300) @Pattern(regexp = "\\S+") String apiKey,
            @NotBlank @Size(min = 40, max = 20_000) String text) {

        @Override
        public String toString() {
            return "PrepareRequest[provider=" + provider + ", apiKey=***, text=" + (text == null ? 0 : text.length()) + " caractères]";
        }
    }

    private final AiPreparationService service;

    public AiController(AiPreparationService service) {
        this.service = service;
    }

    @PostMapping
    List<PreparedItem> prepare(@Valid @RequestBody PrepareRequest request) {
        return service.prepare(request.provider(), request.apiKey(), request.text());
    }
}
