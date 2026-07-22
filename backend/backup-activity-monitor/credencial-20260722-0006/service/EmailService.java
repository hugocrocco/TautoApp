package cl.humboldt.credencial.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

  private static final Logger log = LoggerFactory.getLogger(EmailService.class);

  private final JavaMailSender mailSender;

  @Value("${app.mail.from:SindicatoHbdt@Tauto.cl}")
  private String from;

  public EmailService(JavaMailSender mailSender) {
    this.mailSender = mailSender;
  }

  public void sendVerificationCode(String to, String displayName, String code) {
    if (to == null || to.isBlank()) {
      log.warn("EMAIL NOT SENT: empty recipient");
      return;
    }

    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(from);
    message.setTo(to);
    message.setSubject("Código de verificación - Sindicato Humboldt");
    message.setText(
        "Hola " + displayName + ",\n\n" +
        "Tu código de verificación es: " + code + "\n\n" +
        "Este código vence en 10 minutos.\n\n" +
        "Si no solicitaste este registro, puedes ignorar este correo.\n\n" +
        "Sindicato Humboldt"
    );

    mailSender.send(message);
    log.info("EMAIL SENT OK: to={} from={}", to, from);
  }
  public void sendPasswordResetLink(
    String to,
    String displayName,
    String resetLink
) {
  if (to == null || to.isBlank()) {
    log.warn("PASSWORD RESET EMAIL NOT SENT: empty recipient");
    return;
  }

  SimpleMailMessage message = new SimpleMailMessage();
  message.setFrom(from);
  message.setTo(to);
  message.setSubject("Restablecimiento de contraseña - TAUTO");
  message.setText(
      "Hola " + displayName + ",\n\n" +
      "Recibimos una solicitud para restablecer tu contraseña.\n\n" +
      "Abre el siguiente enlace:\n" +
      resetLink + "\n\n" +
      "Este enlace vence en 15 minutos y solo puede utilizarse una vez.\n\n" +
      "Si no solicitaste este cambio, ignora este correo.\n\n" +
      "TAUTO\n" +
      "Identidad que conecta."
  );

  mailSender.send(message);

  log.info("PASSWORD RESET EMAIL SENT: to={} from={}", to, from);
}

}