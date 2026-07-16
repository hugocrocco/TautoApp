package cl.humboldt.credencial.service;

import cl.humboldt.credencial.entity.PasswordResetToken;
import cl.humboldt.credencial.repo.PasswordResetTokenRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PasswordResetService {

  private final PasswordResetTokenRepository tokenRepository;

  public PasswordResetService(
      PasswordResetTokenRepository tokenRepository
  ) {
    this.tokenRepository = tokenRepository;
  }

  public PasswordResetToken createToken(Long userId) {
    PasswordResetToken token = new PasswordResetToken();

    token.setUserId(userId);
    token.setToken(UUID.randomUUID().toString());
    token.setExpiresAt(LocalDateTime.now().plusMinutes(15));
    token.setUsed(false);

    return tokenRepository.save(token);
  }

  public PasswordResetToken validateToken(String tokenValue) {
    PasswordResetToken token = tokenRepository
        .findByTokenAndUsedFalse(tokenValue)
        .orElseThrow(() ->
            new IllegalArgumentException("El enlace no es válido o ya fue utilizado.")
        );

    if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
      throw new IllegalArgumentException("El enlace de restablecimiento expiró.");
    }

    return token;
  }

  public void markAsUsed(PasswordResetToken token) {
    token.setUsed(true);
    token.setUsedAt(LocalDateTime.now());
    tokenRepository.save(token);
  }
}