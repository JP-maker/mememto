package com.mememto.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

/** Après Google / Microsoft : retrouve ou crée le compte Mememto, ouvre sa session, renvoie vers l'accueil. */
@Component
public class OAuthLoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService auth;

    public OAuthLoginSuccessHandler(AuthService auth) {
        this.auth = auth;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        Optional<String> email = authentication instanceof OAuth2AuthenticationToken token
            ? OAuthIdentity.verifiedEmail(token.getAuthorizedClientRegistrationId(), token.getPrincipal().getAttributes())
            : Optional.empty();
        if (email.isEmpty()) {
            // Adresse absente ou non garantie : on referme la session ouverte par Spring et on refuse.
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            SecurityContextHolder.clearContext();
            response.sendRedirect("/connexion?error");
            return;
        }
        SessionLogin.open(auth.signInWithProvider(email.get()), request, response);
        response.sendRedirect("/");
    }
}
