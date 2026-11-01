package com.mememto.lesson;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mememto.config.SecurityConfig;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(LessonController.class)
@Import(SecurityConfig.class)
class LessonControllerTest {

    private static final String BODY = """
        {"title":"Histoire","text":"La Révolution commence en 1789.","method":"FEYNMAN","deadline":"2026-11-01",
         "minutesPerDay":20,"plan":[{"date":"2026-10-18","type":"LEARN","minutes":20}]}""";

    @Autowired
    MockMvc mvc;

    @MockitoBean
    LessonService lessons;

    @Test
    void anonymousCallsAreRefused() throws Exception {
        mvc.perform(get("/api/lessons")).andExpect(status().isUnauthorized());
    }

    @Test
    void createReturnsTheLessonWithItsIdAtTheTopLevel() throws Exception {
        UUID user = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        when(lessons.create(any(), any())).thenReturn(new LessonView(id, LessonServiceTest.sample()));

        mvc.perform(post("/api/lessons").with(user(user.toString())).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(BODY))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(id.toString()))
            .andExpect(jsonPath("$.title").value("Histoire"));
    }

    @Test
    void invalidContentIsRejected() throws Exception {
        String badMethod = BODY.replace("FEYNMAN", "MAGIE");
        mvc.perform(post("/api/lessons").with(user(UUID.randomUUID().toString())).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(badMethod))
            .andExpect(status().isBadRequest());
    }
}
