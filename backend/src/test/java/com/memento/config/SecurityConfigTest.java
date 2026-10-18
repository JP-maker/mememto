package com.memento.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.memento.web.PingController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PingController.class)
@Import(SecurityConfig.class)
class SecurityConfigTest {

    @Autowired
    MockMvc mvc;

    @Test
    void pingIsPublicAndSendsSecurityHeaders() throws Exception {
        mvc.perform(get("/api/ping"))
            .andExpect(status().isOk())
            .andExpect(header().string("X-Content-Type-Options", "nosniff"))
            .andExpect(header().exists("Content-Security-Policy"));
    }

    @Test
    void everythingElseRequiresAuthentication() throws Exception {
        mvc.perform(get("/api/lessons")).andExpect(status().isUnauthorized());
    }
}
