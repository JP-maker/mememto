package com.mememto.auth;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mememto.config.SecurityConfig;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    AuthService auth;

    private static final String VALID_REGISTER = "{\"email\":\"jp@mememto.fr\",\"password\":\"motdepasse-solide\"}";

    @Test
    void registerNeedsTheCsrfToken() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(VALID_REGISTER))
            .andExpect(status().isForbidden());
    }

    @Test
    void registerAnswers202EvenWithoutSession() throws Exception {
        mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(VALID_REGISTER))
            .andExpect(status().isAccepted());
    }

    @Test
    void registerRejectsAWeakPasswordAndABadEmail() throws Exception {
        mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"jp@mememto.fr\",\"password\":\"court\"}"))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"pas-un-mail\",\"password\":\"motdepasse-solide\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void loginReturnsTheEmailAndOpensASession() throws Exception {
        when(auth.authenticate("jp@mememto.fr", "motdepasse-solide"))
            .thenReturn(new User("jp@mememto.fr", "hash", Instant.now()));

        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(VALID_REGISTER))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("jp@mememto.fr"));
    }

    @Test
    void loginMapsErrorsToStatusCodes() throws Exception {
        doThrow(new EmailNotConfirmedException()).when(auth).authenticate(anyString(), anyString());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(VALID_REGISTER))
            .andExpect(status().isForbidden());

        doThrow(new InvalidCredentialsException()).when(auth).authenticate(anyString(), anyString());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(VALID_REGISTER))
            .andExpect(status().isUnauthorized());

        doThrow(new TooManyAttemptsException()).when(auth).authenticate(anyString(), anyString());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(VALID_REGISTER))
            .andExpect(status().isTooManyRequests());
    }

    @Test
    void confirmWithABadTokenAnswers400() throws Exception {
        doThrow(new InvalidTokenException()).when(auth).confirmEmail("mauvais");
        mvc.perform(post("/api/auth/confirm").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"mauvais\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void meRequiresASession() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());

        UUID id = UUID.randomUUID();
        when(auth.find(id)).thenReturn(Optional.of(new User("jp@mememto.fr", "hash", Instant.now())));
        mvc.perform(get("/api/auth/me").with(user(id.toString())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("jp@mememto.fr"));
    }
}
