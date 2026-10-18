package com.memento.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

/** Ouvre la session d'un utilisateur, que la connexion vienne du mot de passe ou de Google / Microsoft. */
final class SessionLogin {

    private static final SecurityContextRepository CONTEXTS = new HttpSessionSecurityContextRepository();

    private SessionLogin() {
    }

    static void open(User user, HttpServletRequest request, HttpServletResponse response) {
        if (request.getSession(false) != null) {
            request.changeSessionId(); // nouvel identifiant de session à la connexion (anti fixation de session)
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(user.getId().toString(), null, List.of()));
        SecurityContextHolder.setContext(context);
        CONTEXTS.saveContext(context, request, response);
    }
}
