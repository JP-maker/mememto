package com.mememto.ai;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mememto.config.SecurityConfig;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AiController.class)
@Import(SecurityConfig.class)
class AiControllerTest {

    private static final String LESSON = "La Bastille est prise le 14 juillet 1789. Louis XVI est guillotiné en 1793.";
    private static final String BODY = "{\"provider\":\"ANTHROPIC\",\"apiKey\":\"sk-ma-cle-secrete\",\"text\":\"" + LESSON + "\"}";

    @Autowired
    MockMvc mvc;

    @MockitoBean
    AiPreparationService service;

    @Test
    void worksWithoutAnAccountButNeedsTheCsrfToken() throws Exception {
        mvc.perform(post("/api/prepare").contentType(MediaType.APPLICATION_JSON).content(BODY))
            .andExpect(status().isForbidden());
    }

    @Test
    void returnsThePreparedItems() throws Exception {
        when(service.prepare(eq(AiProvider.ANTHROPIC), eq("sk-ma-cle-secrete"), any())).thenReturn(
            List.of(new PreparedItem("Louis XVI est guillotiné en 1793.", "1793", List.of("1793"), List.of("1789", "1791", "1795"))));

        mvc.perform(post("/api/prepare").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(BODY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].answer").value("1793"));
    }

    @Test
    void rejectsAnUnknownProviderAndAKeyWithSpaces() throws Exception {
        mvc.perform(post("/api/prepare").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(BODY.replace("ANTHROPIC", "AUTRE")))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/api/prepare").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(BODY.replace("sk-ma-cle-secrete", "une cle avec espaces")))
            .andExpect(status().isBadRequest());
    }

    @Test
    void mapsProviderErrors() throws Exception {
        doThrow(new AiKeyRejectedException()).when(service).prepare(any(), any(), any());
        mvc.perform(post("/api/prepare").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(BODY))
            .andExpect(status().isUnprocessableEntity());

        doThrow(new AiUnavailableException()).when(service).prepare(any(), any(), any());
        mvc.perform(post("/api/prepare").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(BODY))
            .andExpect(status().isBadGateway());
    }
}
