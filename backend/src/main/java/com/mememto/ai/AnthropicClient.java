package com.mememto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import org.springframework.web.client.RestClient;

/** API Messages d'Anthropic. */
public class AnthropicClient implements LlmClient {

    record Message(String role, String content) {
    }

    record Request(String model, @JsonProperty("max_tokens") int maxTokens, String system, List<Message> messages) {
    }

    record Block(String type, String text) {
    }

    record Response(List<Block> content) {
    }

    private final RestClient http;
    private final String model;

    public AnthropicClient(RestClient.Builder builder, String model) {
        this.http = builder.build();
        this.model = model;
    }

    @Override
    public AiProvider provider() {
        return AiProvider.ANTHROPIC;
    }

    @Override
    public String complete(String apiKey, String system, String user) {
        Response response = LlmCalls.run(() -> http.post()
            .uri("/v1/messages")
            .header("x-api-key", apiKey)
            .header("anthropic-version", "2023-06-01")
            .body(new Request(model, 8000, system, List.of(new Message("user", user))))
            .retrieve()
            .body(Response.class));
        if (response == null || response.content() == null) {
            throw new AiUnavailableException();
        }
        return response.content().stream()
            .filter(block -> "text".equals(block.type()) && block.text() != null)
            .map(Block::text)
            .findFirst()
            .orElseThrow(AiUnavailableException::new);
    }
}
