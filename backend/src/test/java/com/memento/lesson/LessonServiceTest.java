package com.memento.lesson;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class LessonServiceTest {

    LessonRepository repo = mock(LessonRepository.class);
    LessonService service;
    UUID owner = UUID.randomUUID();

    static LessonData sample() {
        return new LessonData("Histoire", "La Révolution commence en 1789.", "FEYNMAN", "2026-11-01", 20,
            List.of(new LessonData.PlanDay("2026-10-18", "LEARN", 20)), List.of("2026-10-18"), Map.of("0", "2026-10-19T08:00:00Z"));
    }

    @BeforeEach
    void setUp() {
        service = new LessonService(repo, new ObjectMapper(), Clock.systemUTC());
        when(repo.save(any(Lesson.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void createStoresTheLessonAndReturnsItUnchanged() {
        LessonView created = service.create(owner, sample());

        assertEquals(sample(), created.lesson());
        verify(repo).save(any(Lesson.class));
    }

    @Test
    void createRefusesPastTheLimit() {
        when(repo.countByUserId(owner)).thenReturn((long) LessonService.MAX_PER_USER);

        assertThrows(LessonLimitException.class, () -> service.create(owner, sample()));
        verify(repo, never()).save(any());
    }

    @Test
    void updateAndDeleteOnlyReachTheOwnersLessons() {
        UUID id = UUID.randomUUID();
        when(repo.findByIdAndUserId(id, owner)).thenReturn(Optional.empty());

        assertThrows(LessonNotFoundException.class, () -> service.update(owner, id, sample()));
        assertThrows(LessonNotFoundException.class, () -> service.delete(owner, id));
        verify(repo, never()).delete(any());
    }

    @Test
    void updateReplacesTheContent() {
        Lesson stored = new Lesson(owner, "Ancien", "{}", Clock.systemUTC().instant());
        when(repo.findByIdAndUserId(stored.getId(), owner)).thenReturn(Optional.of(stored));

        LessonView updated = service.update(owner, stored.getId(), sample());

        assertEquals("Histoire", stored.getTitle());
        assertEquals(sample(), updated.lesson());
    }
}
