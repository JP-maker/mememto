package com.memento.lesson;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Leçons du compte connecté (la sécurité refuse tout appel sans session). */
@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonService lessons;

    public LessonController(LessonService lessons) {
        this.lessons = lessons;
    }

    @GetMapping
    List<LessonView> list(Authentication who) {
        return lessons.list(userId(who));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    LessonView create(Authentication who, @Valid @RequestBody LessonData data) {
        return lessons.create(userId(who), data);
    }

    @PutMapping("/{id}")
    LessonView update(Authentication who, @PathVariable UUID id, @Valid @RequestBody LessonData data) {
        return lessons.update(userId(who), id, data);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(Authentication who, @PathVariable UUID id) {
        lessons.delete(userId(who), id);
    }

    private static UUID userId(Authentication who) {
        return UUID.fromString(who.getName());
    }
}
