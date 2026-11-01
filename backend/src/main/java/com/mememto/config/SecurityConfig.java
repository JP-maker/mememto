package com.mememto.config;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

/**
 * Règles de sécurité (OWASP) : tout est refusé par défaut, seules les routes
 * listées sont publiques, les réponses portent des en-têtes de protection.
 * Les routes /api/auth/* gèrent l'e-mail et le mot de passe ; Google et Microsoft passent par oauth2Login.
 */
@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain api(HttpSecurity http, ObjectProvider<ClientRegistrationRepository> clients,
                              ObjectProvider<AuthenticationSuccessHandler> oauthSuccess) throws Exception {
        http
            // CSRF actif : le front Angular renvoie le cookie XSRF-TOKEN dans l'en-tête X-XSRF-TOKEN.
            // /api/plan est un calcul pur, sans session ni donnée enregistrée : pas de jeton CSRF à exiger.
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                // Jeton en clair dans le cookie : c'est ce que renvoie Angular dans X-XSRF-TOKEN.
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                .ignoringRequestMatchers("/api/plan"))
            .addFilterAfter(new CsrfCookieFilter(), CsrfFilter.class)
            // L'API ne renvoie que du JSON : aucune ressource externe n'est autorisée.
            .headers(h -> h.contentSecurityPolicy(csp ->
                csp.policyDirectives("default-src 'none'; frame-ancestors 'none'")))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/ping", "/actuator/health").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/plan").permitAll()
                // /api/auth/me reste protégé : c'est lui qui dit au front si une session est ouverte.
                .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/confirm", "/api/auth/login",
                    "/api/auth/logout", "/api/auth/forgot", "/api/auth/reset").permitAll()
                .anyRequest().authenticated())
            // 401 en JSON-friendly plutôt qu'une redirection vers un formulaire.
            .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)));
        // Connexion Google / Microsoft : /oauth2/authorization/{google|microsoft}, retour sur /login/oauth2/code/*.
        // Le gestionnaire de succès ouvre la session Mememto ; sans fournisseur configuré (tests), on n'active rien.
        if (clients.getIfAvailable() != null) {
            http.oauth2Login(oauth -> {
                oauth.loginPage("/connexion").failureUrl("/connexion?error");
                oauthSuccess.ifAvailable(oauth::successHandler);
            });
        }
        return http.build();
    }
}
