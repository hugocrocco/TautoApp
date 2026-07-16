package cl.humboldt.credencial.controller;

import cl.humboldt.credencial.entity.AppUser;
import cl.humboldt.credencial.entity.PasswordResetToken;
import cl.humboldt.credencial.repo.AppUserRepository;
import cl.humboldt.credencial.service.EmailService;
import cl.humboldt.credencial.service.PasswordResetService;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;
import java.util.Map;

@CrossOrigin(
    origins = {
        "http://localhost:5173",
        "http://192.168.1.7:5173",
        "https://tauto.cl",
        "https://www.tauto.cl",
        "https://hbdt.tauto.cl"
    },
    allowCredentials = "false"
)
@RestController
@RequestMapping("/api/auth")
public class PasswordController {

  private static final Logger log =
      LoggerFactory.getLogger(PasswordController.class);

  private final AppUserRepository appUserRepository;
  private final PasswordResetService passwordResetService;
  private final EmailService emailService;
  private final String frontendBaseUrl;

  public PasswordController(
      AppUserRepository appUserRepository,
      PasswordResetService passwordResetService,
      EmailService emailService,
      @Value("${app.frontend.base-url:https://hbdt.tauto.cl}")
      String frontendBaseUrl
  ) {
    this.appUserRepository = appUserRepository;
    this.passwordResetService = passwordResetService;
    this.emailService = emailService;
    this.frontendBaseUrl = frontendBaseUrl;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  static class ForgotPasswordRequest {
    public String rut;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  static class ResetPasswordRequest {
    public String token;
    public String newPassword;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  static class ChangePasswordRequest {
    public String rut;
    public String currentPassword;
    public String newPassword;
  }

  @PostMapping(
      value = "/forgot-password",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> forgotPassword(
      @RequestBody ForgotPasswordRequest request
  ) {
    String rut = normalizeRut(request == null ? "" : request.rut);

    String genericMessage =
        "Si el RUT corresponde a una cuenta registrada, enviaremos un enlace al correo asociado.";

    if (rut.isBlank()) {
      return ResponseEntity.ok(Map.of(
          "ok", true,
          "message", genericMessage
      ));
    }

    var userOptional = appUserRepository.findByRut(rut);

    if (userOptional.isEmpty()) {
      log.info(
          "PASSWORD RESET REQUEST: rut={} usuario no encontrado",
          rut
      );

      return ResponseEntity.ok(Map.of(
          "ok", true,
          "message", genericMessage
      ));
    }

    AppUser user = userOptional.get();

    try {
      PasswordResetToken resetToken =
          passwordResetService.createToken(user.getId());

      String resetLink =
          frontendBaseUrl
              + "/#/reset-password/"
              + resetToken.getToken();

      emailService.sendPasswordResetLink(
          user.getEmail(),
          user.getDisplayName(),
          resetLink
      );

      log.info(
          "PASSWORD RESET REQUEST OK: rut={} email={}",
          rut,
          user.getEmail()
      );
    } catch (Exception exception) {
      log.error(
          "PASSWORD RESET REQUEST FAIL: rut={} message={}",
          rut,
          exception.getMessage(),
          exception
      );
    }

    return ResponseEntity.ok(Map.of(
        "ok", true,
        "message", genericMessage
    ));
  }

  @PostMapping(
      value = "/reset-password",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> resetPassword(
      @RequestBody ResetPasswordRequest request
  ) {
    String token =
        request == null || request.token == null
            ? ""
            : request.token.trim();

    String newPassword =
        request == null || request.newPassword == null
            ? ""
            : request.newPassword;

    if (token.isBlank() || newPassword.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "Debes ingresar la nueva contraseña."
      ));
    }

    if (newPassword.length() < 6) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "La nueva contraseña debe tener al menos 6 caracteres."
      ));
    }

    try {
      PasswordResetToken resetToken =
          passwordResetService.validateToken(token);

      AppUser user = appUserRepository
          .findById(resetToken.getUserId())
          .orElseThrow(() ->
              new IllegalArgumentException(
                  "No existe el usuario asociado al enlace."
              )
          );

      user.setPasswordHash(
          BCrypt.hashpw(newPassword, BCrypt.gensalt(10))
      );

      appUserRepository.save(user);
      passwordResetService.markAsUsed(resetToken);

      log.info(
          "PASSWORD RESET OK: rut={}",
          user.getRut()
      );

      return ResponseEntity.ok(Map.of(
          "ok", true,
          "message", "Contraseña restablecida correctamente."
      ));
    } catch (IllegalArgumentException exception) {
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", exception.getMessage()
      ));
    }
  }

  @PostMapping(
      value = "/change-password",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> changePassword(
      @RequestBody ChangePasswordRequest request
  ) {
    String rut =
        normalizeRut(request == null ? "" : request.rut);

    String currentPassword =
        request == null || request.currentPassword == null
            ? ""
            : request.currentPassword;

    String newPassword =
        request == null || request.newPassword == null
            ? ""
            : request.newPassword;

    if (
        rut.isBlank()
            || currentPassword.isBlank()
            || newPassword.isBlank()
    ) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "Debes completar todos los campos."
      ));
    }

    if (newPassword.length() < 6) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "La nueva contraseña debe tener al menos 6 caracteres."
      ));
    }

    var userOptional = appUserRepository.findByRut(rut);

    if (userOptional.isEmpty()) {
      return ResponseEntity.status(404).body(Map.of(
          "ok", false,
          "message", "No se encontró la cuenta."
      ));
    }

    AppUser user = userOptional.get();

    if (!BCrypt.checkpw(currentPassword, user.getPasswordHash())) {
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "La contraseña actual no es correcta."
      ));
    }

    if (BCrypt.checkpw(newPassword, user.getPasswordHash())) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "La nueva contraseña debe ser diferente a la actual."
      ));
    }

    user.setPasswordHash(
        BCrypt.hashpw(newPassword, BCrypt.gensalt(10))
    );

    appUserRepository.save(user);

    log.info(
        "PASSWORD CHANGE OK: rut={}",
        rut
    );

    return ResponseEntity.ok(Map.of(
        "ok", true,
        "message", "Contraseña cambiada correctamente."
    ));
  }

  private String normalizeRut(String rut) {
    if (rut == null) {
      return "";
    }

    String normalized = rut
        .trim()
        .toUpperCase(Locale.ROOT)
        .replace(".", "")
        .replace("-", "")
        .replace(" ", "");

    if (normalized.length() < 2) {
      return normalized;
    }

    return normalized.substring(0, normalized.length() - 1)
        + "-"
        + normalized.substring(normalized.length() - 1);
  }
}