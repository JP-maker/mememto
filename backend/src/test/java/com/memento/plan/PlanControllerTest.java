package com.memento.plan;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.memento.config.SecurityConfig;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PlanController.class)
@Import({SecurityConfig.class, PlanService.class, PlanControllerTest.FixedClock.class})
class PlanControllerTest {

    @TestConfiguration
    static class FixedClock {
        @Bean
        Clock clock() {
            return Clock.fixed(Instant.parse("2026-10-17T10:00:00Z"), ZoneId.of("Europe/Paris"));
        }
    }

    @Autowired
    MockMvc mvc;

    private org.springframework.test.web.servlet.ResultActions send(String json) throws Exception {
        return mvc.perform(post("/api/plan").contentType(MediaType.APPLICATION_JSON).content(json));
    }

    @Test
    void returnsThePlanWithoutAuthenticationNorCsrfToken() throws Exception {
        send("{\"deadline\":\"2026-10-31\",\"minutesPerDay\":20}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(15))
                .andExpect(jsonPath("$[0].type").value("LEARN"))
                .andExpect(jsonPath("$[0].date").value("2026-10-17"))
                .andExpect(jsonPath("$[14].type").value("FINAL"));
    }

    @Test
    void rejectsMinutesOutsideTheAllowedRange() throws Exception {
        send("{\"deadline\":\"2026-10-31\",\"minutesPerDay\":1}").andExpect(status().isBadRequest());
    }

    @Test
    void rejectsAMissingDeadline() throws Exception {
        send("{\"minutesPerDay\":20}").andExpect(status().isBadRequest());
    }

    @Test
    void rejectsADeadlineInThePast() throws Exception {
        send("{\"deadline\":\"2026-10-01\",\"minutesPerDay\":20}").andExpect(status().isBadRequest());
    }
}
