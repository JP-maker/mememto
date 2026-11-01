package com.mememto.ai;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/** Clients des fournisseurs d'IA : adresses fixes, délais courts. Les modèles se changent par configuration. */
@Configuration
public class AiConfig {

    @Bean
    AnthropicClient anthropicClient(@Value("${mememto.ai.anthropic-model}") String model) {
        return new AnthropicClient(builder("https://api.anthropic.com"), model);
    }

    @Bean
    OpenAiClient openAiClient(@Value("${mememto.ai.openai-model}") String model) {
        return new OpenAiClient(builder("https://api.openai.com"), model);
    }

    private static RestClient.Builder builder(String baseUrl) {
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
        factory.setReadTimeout(Duration.ofSeconds(90));
        return RestClient.builder().baseUrl(baseUrl).requestFactory(factory);
    }
}
