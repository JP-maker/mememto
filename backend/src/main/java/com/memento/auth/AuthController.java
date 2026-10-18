package com.memento.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Points d'entrée des comptes. Toute la logique est dans {@link AuthService}. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    record RegisterRequest(@NotBlank @Email @Size(max = 254) String email,
                           @NotBlank @Size(min = 10, max = 128) String password) {
    }

    record LoginRequest(@NotBlank @Size(max = 254) String email, @NotBlank @Size(max = 128) String password) {
    }

    record EmailRequest(@NotBlank @Email @Size(max = 254) String email) {
    }

    record TokenRequest(@NotBlank @Size(max = 100) String token) {
    }

    record ResetRequest(@NotBlank @Size(max = 100) String token,
                        @NotBlank @Size(min = 10, max = 128) String password) {
    }

    record Me(String email) {
    }

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.ACCEPTED)
    void register(@Valid @RequestBody RegisterRequest request) {
        auth.register(request.email(), request.password());
    }

    @PostMapping("/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void confirm(@Valid @RequestBody TokenRequest request) {
        auth.confirmEmail(request.token());
    }

    @PostMapping("/login")
    Me login(@Valid @RequestBody LoginRequest request, HttpServletRequest http, HttpServletResponse response) {
        User user = auth.authenticate(request.email(), request.password());
        SessionLogin.open(user, http, response);
        return new Me(user.getEmail());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void logout(HttpServletRequest http) {
        HttpSession session = http.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    /** Utilisé par le front au chargement pour savoir si une session est ouverte (401 sinon). */
    @GetMapping("/me")
    Me me(Authentication authentication) {
        return auth.find(UUID.fromString(authentication.getName()))
            .map(user -> new Me(user.getEmail()))
            .orElseThrow(InvalidCredentialsException::new);
    }

    @PostMapping("/forgot")
    @ResponseStatus(HttpStatus.ACCEPTED)
    void forgot(@Valid @RequestBody EmailRequest request) {
        auth.forgotPassword(request.email());
    }

    @PostMapping("/reset")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void reset(@Valid @RequestBody ResetRequest request) {
        auth.resetPassword(request.token(), request.password());
    }
}
