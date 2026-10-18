package com.memento.auth;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class LoginThrottleTest {

    /** Horloge réglable à la main. */
    static class MutableClock extends Clock {
        Instant now = Instant.parse("2026-10-18T10:00:00Z");

        @Override
        public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    @Test
    void blocksAfterFiveFailuresThenReleasesAfterTheWindow() {
        MutableClock clock = new MutableClock();
        LoginThrottle throttle = new LoginThrottle(clock);

        for (int i = 0; i < LoginThrottle.MAX_FAILURES - 1; i++) {
            throttle.failure("a@b.fr");
        }
        assertFalse(throttle.isBlocked("a@b.fr"));
        throttle.failure("a@b.fr");
        assertTrue(throttle.isBlocked("a@b.fr"));
        assertFalse(throttle.isBlocked("autre@b.fr"));

        clock.now = clock.now.plus(LoginThrottle.WINDOW).plusSeconds(1);
        assertFalse(throttle.isBlocked("a@b.fr"));
    }

    @Test
    void successResetsTheCounter() {
        LoginThrottle throttle = new LoginThrottle(new MutableClock());
        for (int i = 0; i < LoginThrottle.MAX_FAILURES; i++) {
            throttle.failure("a@b.fr");
        }
        throttle.reset("a@b.fr");
        assertFalse(throttle.isBlocked("a@b.fr"));
    }
}
