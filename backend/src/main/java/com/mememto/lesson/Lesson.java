package com.mememto.lesson;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Leçon enregistrée dans un compte. {@code data} contient le {@link LessonData} sérialisé en JSON. */
@Entity
@Table(name = "lessons")
public class Lesson {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String data;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Lesson() {
        // requis par JPA
    }

    public Lesson(UUID userId, String title, String data, Instant updatedAt) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.title = title;
        this.data = data;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getTitle() {
        return title;
    }

    public String getData() {
        return data;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void update(String title, String data, Instant updatedAt) {
        this.title = title;
        this.data = data;
        this.updatedAt = updatedAt;
    }
}
