package com.memento.plan;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

/**
 * Répartit le travail entre aujourd'hui et la date butoir.
 * Jour 0 : découverte. Révisions à J+1, J+3, J+7, puis chaque semaine, et la veille.
 * Dernier jour : test complet. Les autres jours sont des jours de repos.
 */
@Service
public class PlanService {

    /** Au-delà d'un an, un plan n'a plus de sens et on évite des réponses démesurées. */
    static final int MAX_DAYS = 365;
    private static final int MIN_REVIEW_MINUTES = 5;
    private static final Set<Integer> EARLY_REVIEWS = Set.of(1, 3, 7);

    private final Clock clock;

    public PlanService(Clock clock) {
        this.clock = clock;
    }

    public List<PlanDay> build(LocalDate deadline, int minutesPerDay) {
        LocalDate today = LocalDate.now(clock);
        long days = ChronoUnit.DAYS.between(today, deadline);
        if (days < 1 || days > MAX_DAYS) {
            throw new InvalidPlanException("La date butoir doit être comprise entre demain et " + MAX_DAYS + " jours.");
        }
        int last = (int) days;
        List<PlanDay> plan = new ArrayList<>(last + 1);
        for (int day = 0; day <= last; day++) {
            SessionType type = typeOf(day, last);
            plan.add(new PlanDay(today.plusDays(day), type, minutesFor(type, minutesPerDay)));
        }
        return plan;
    }

    private static SessionType typeOf(int day, int last) {
        if (day == 0) {
            return SessionType.LEARN;
        }
        if (day == last) {
            return SessionType.FINAL;
        }
        boolean review = EARLY_REVIEWS.contains(day) || day == last - 1 || (day > 7 && day % 7 == 0);
        return review ? SessionType.REVIEW : SessionType.REST;
    }

    private static int minutesFor(SessionType type, int minutesPerDay) {
        return switch (type) {
            case LEARN, FINAL -> minutesPerDay;
            case REVIEW -> Math.max(MIN_REVIEW_MINUTES, minutesPerDay / 2);
            case REST -> 0;
        };
    }
}
