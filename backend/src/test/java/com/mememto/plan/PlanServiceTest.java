package com.mememto.plan;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;

class PlanServiceTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-17T10:00:00Z"), ZoneId.of("Europe/Paris"));
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 17);

    private final PlanService service = new PlanService(CLOCK);

    @Test
    void startsWithLearningAndEndsWithFinalTestOnTheDeadline() {
        List<PlanDay> plan = service.build(TODAY.plusDays(14), 20);

        assertEquals(15, plan.size());
        assertEquals(new PlanDay(TODAY, SessionType.LEARN, 20), plan.get(0));
        assertEquals(new PlanDay(TODAY.plusDays(14), SessionType.FINAL, 20), plan.get(14));
    }

    @Test
    void reviewsAreSpacedAndTheDayBeforeTheDeadlineIsAReview() {
        List<PlanDay> plan = service.build(TODAY.plusDays(14), 20);

        List<Integer> reviewDays = IntStream.range(0, plan.size())
                .filter(i -> plan.get(i).type() == SessionType.REVIEW)
                .boxed()
                .toList();

        assertEquals(List.of(1, 3, 7, 13), reviewDays);
    }

    @Test
    void reviewsLastHalfAsLongAndRestDaysHaveNoWork() {
        List<PlanDay> plan = service.build(TODAY.plusDays(14), 20);

        assertEquals(10, plan.get(1).minutes());
        assertEquals(SessionType.REST, plan.get(2).type());
        assertEquals(0, plan.get(2).minutes());
    }

    @Test
    void deadlineTomorrowGivesLearningThenFinalTest() {
        List<PlanDay> plan = service.build(TODAY.plusDays(1), 20);

        assertEquals(List.of(SessionType.LEARN, SessionType.FINAL), plan.stream().map(PlanDay::type).toList());
    }

    @Test
    void reviewsNeverDropBelowFiveMinutes() {
        List<PlanDay> plan = service.build(TODAY.plusDays(2), 5);

        assertEquals(5, plan.get(1).minutes());
    }

    @Test
    void rejectsADeadlineTodayInThePastOrMoreThanAYearAway() {
        for (int offset : new int[] {0, -3, 366}) {
            assertThrows(InvalidPlanException.class, () -> service.build(TODAY.plusDays(offset), 20));
        }
    }
}
