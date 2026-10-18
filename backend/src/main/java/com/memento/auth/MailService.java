package com.memento.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/** Envoie les e-mails de compte. Un échec d'envoi est journalisé sans adresse ni jeton, et ne casse pas la requête. */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender sender;
    private final String from;
    private final String baseUrl;

    public MailService(JavaMailSender sender,
                       @Value("${memento.mail.from}") String from,
                       @Value("${memento.base-url}") String baseUrl) {
        this.sender = sender;
        this.from = from;
        this.baseUrl = baseUrl;
    }

    public void sendConfirmation(String to, String token) {
        send(to, "Confirme ton adresse e-mail Memento",
            "Bonjour,\n\nPour activer ton compte Memento, ouvre ce lien (valable 24 heures) :\n"
                + baseUrl + "/verification?token=" + token
                + "\n\nSi tu n'as pas créé de compte, ignore ce message.\n");
    }

    public void sendPasswordReset(String to, String token) {
        send(to, "Réinitialise ton mot de passe Memento",
            "Bonjour,\n\nPour choisir un nouveau mot de passe, ouvre ce lien (valable 1 heure) :\n"
                + baseUrl + "/reinitialisation?token=" + token
                + "\n\nSi tu n'as rien demandé, ignore ce message : ton mot de passe reste inchangé.\n");
    }

    private void send(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        try {
            sender.send(message);
        } catch (MailException e) {
            log.warn("Envoi d'e-mail impossible : {}", e.getClass().getSimpleName());
        }
    }
}
