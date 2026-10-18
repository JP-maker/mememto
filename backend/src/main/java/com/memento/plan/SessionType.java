package com.memento.plan;

/** Nature de la séance d'un jour du plan. */
public enum SessionType {
    /** Premier jour : découverte de la leçon. */
    LEARN,
    /** Révision espacée. */
    REVIEW,
    /** Jour sans séance. */
    REST,
    /** Dernier jour : test complet. */
    FINAL
}
