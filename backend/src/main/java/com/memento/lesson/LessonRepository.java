package com.memento.lesson;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {
    List<Lesson> findByUserIdOrderByUpdatedAtDesc(UUID userId);

    /** Toujours chercher avec le propriétaire : une leçon d'un autre compte reste introuvable. */
    Optional<Lesson> findByIdAndUserId(UUID id, UUID userId);

    long countByUserId(UUID userId);
}
