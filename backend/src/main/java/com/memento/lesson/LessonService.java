package com.memento.lesson;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Leçons d'un compte. Toutes les opérations sont limitées au propriétaire. */
@Service
@Transactional
public class LessonService {

    static final int MAX_PER_USER = 50;

    private final LessonRepository lessons;
    private final ObjectMapper json;
    private final Clock clock;

    public LessonService(LessonRepository lessons, ObjectMapper json, Clock clock) {
        this.lessons = lessons;
        this.json = json;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<LessonView> list(UUID userId) {
        return lessons.findByUserIdOrderByUpdatedAtDesc(userId).stream().map(this::view).toList();
    }

    public LessonView create(UUID userId, LessonData data) {
        if (lessons.countByUserId(userId) >= MAX_PER_USER) {
            throw new LessonLimitException();
        }
        return view(lessons.save(new Lesson(userId, data.title(), write(data), clock.instant())));
    }

    public LessonView update(UUID userId, UUID id, LessonData data) {
        Lesson lesson = lessons.findByIdAndUserId(id, userId).orElseThrow(LessonNotFoundException::new);
        lesson.update(data.title(), write(data), clock.instant());
        return view(lesson);
    }

    public void delete(UUID userId, UUID id) {
        lessons.delete(lessons.findByIdAndUserId(id, userId).orElseThrow(LessonNotFoundException::new));
    }

    private String write(LessonData data) {
        try {
            return json.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    private LessonView view(Lesson lesson) {
        try {
            return new LessonView(lesson.getId(), json.readValue(lesson.getData(), LessonData.class));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }
}
