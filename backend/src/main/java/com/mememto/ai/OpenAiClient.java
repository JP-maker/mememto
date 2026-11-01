package com.mememto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;
import org.springframework.web.client.RestClient;

/** API Chat Completions d'OpenAI. */
public class OpenAiClient implements LlmClient {

    record Message(String role, String content) {
    }

    record Request(String model, List<Message> messages, @JsonProperty("response_format") Map<String, String> responseFormat) {
    }

    record Choice(Message message) {
    }

    record Response(List<Choice> choices) {
    }

    private final RestClient http;
    private final String model;

    public OpenAiClient(RestClient.Builder builder, String model) {
        this.http = builder.build();
        this.model = model;
    }

    @Override
    public AiProvider provider() {
        return AiProvider.OPENAI;
    }

    @Override
    public String complete(String apiKey, String system, String user) {
        Response response = LlmCalls.run(() -> http.post()
            .uri("/v1/chat/completions")
            .header("Authorization", "Bearer " + apiKey)
            .body(new Request(model, List.of(new Message("system", system), new Message("user", user)),
                Map.of("type", "json_object")))
            .retrieve()
            .body(Response.class));
        if (response == null || response.choices() == null || response.choices().isEmpty()
                || response.choices().get(0).message() == null || response.choices().get(0).message().content() == null) {
            throw new AiUnavailableException();
        }
        return response.choices().get(0).message().content();
    }
}
