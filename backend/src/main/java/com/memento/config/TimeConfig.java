package com.memento.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Horloge unique de l'application, remplaçable dans les tests. */
@Configuration
public class TimeConfig {

    // shortcut: un seul fuseau, à rendre configurable si des utilisateurs hors de France arrivent.
    @Bean
    Clock clock() {
        return Clock.system(ZoneId.of("Europe/Paris"));
    }
}
