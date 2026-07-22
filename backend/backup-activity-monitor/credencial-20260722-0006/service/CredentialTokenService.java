package cl.humboldt.credencial.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class CredentialTokenService {

  private static final long DEFAULT_TTL_SECONDS = 180L;
  private static final SecureRandom RANDOM = new SecureRandom();

  private final String secret;
  private final long ttlSeconds;

  public CredentialTokenService(
      @Value("${app.credential-secret:${app.admin-key:hbdt}}") String secret,
      @Value("${app.credential-ttl-seconds:180}") long ttlSeconds
  ) {
    this.secret = (secret == null || secret.isBlank()) ? "hbdt" : secret;
    this.ttlSeconds = ttlSeconds > 0 ? ttlSeconds : DEFAULT_TTL_SECONDS;
  }

  public GeneratedToken generate(String rut) {
    long expiresAtMillis = Instant.now().plusSeconds(ttlSeconds).toEpochMilli();
    String nonce = randomNonce();
    String payload = rut + "|" + expiresAtMillis + "|" + nonce;
    String payloadB64 = base64Url(payload.getBytes(StandardCharsets.UTF_8));
    String signature = sign(payloadB64);
    String token = payloadB64 + "." + signature;

    return new GeneratedToken(token, expiresAtMillis, ttlSeconds);
  }

  public VerifiedToken verify(String token) {
    if (token == null || token.isBlank() || !token.contains(".")) {
      return VerifiedToken.invalid("Token inválido.");
    }

    String[] parts = token.split("\\.", 2);
    if (parts.length != 2) {
      return VerifiedToken.invalid("Token inválido.");
    }

    String payloadB64 = parts[0];
    String receivedSignature = parts[1];
    String expectedSignature = sign(payloadB64);

    if (!constantTimeEquals(receivedSignature, expectedSignature)) {
      return VerifiedToken.invalid("Firma inválida.");
    }

    String payload;
    try {
      payload = new String(Base64.getUrlDecoder().decode(payloadB64), StandardCharsets.UTF_8);
    } catch (IllegalArgumentException ex) {
      return VerifiedToken.invalid("Token ilegible.");
    }

    String[] values = payload.split("\\|", 3);
    if (values.length < 3) {
      return VerifiedToken.invalid("Token incompleto.");
    }

    String rut = values[0];
    long expiresAtMillis;
    try {
      expiresAtMillis = Long.parseLong(values[1]);
    } catch (NumberFormatException ex) {
      return VerifiedToken.invalid("Vencimiento inválido.");
    }

    long now = Instant.now().toEpochMilli();
    long remainingSeconds = Math.max(0L, (expiresAtMillis - now) / 1000L);

    if (expiresAtMillis <= now) {
      return VerifiedToken.expired(rut, expiresAtMillis);
    }

    return VerifiedToken.valid(rut, expiresAtMillis, remainingSeconds);
  }

  private String sign(String value) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      return base64Url(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception ex) {
      throw new IllegalStateException("No se pudo firmar el token de credencial", ex);
    }
  }

  private String randomNonce() {
    byte[] bytes = new byte[12];
    RANDOM.nextBytes(bytes);
    return HexFormat.of().formatHex(bytes);
  }

  private String base64Url(byte[] bytes) {
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private boolean constantTimeEquals(String a, String b) {
    if (a == null || b == null) return false;
    byte[] aa = a.getBytes(StandardCharsets.UTF_8);
    byte[] bb = b.getBytes(StandardCharsets.UTF_8);
    if (aa.length != bb.length) return false;
    int result = 0;
    for (int i = 0; i < aa.length; i++) {
      result |= aa[i] ^ bb[i];
    }
    return result == 0;
  }

  public record GeneratedToken(String token, long expiresAtMillis, long ttlSeconds) {}

  public record VerifiedToken(
      boolean valid,
      boolean expired,
      String rut,
      long expiresAtMillis,
      long remainingSeconds,
      String message
  ) {
    public static VerifiedToken valid(String rut, long expiresAtMillis, long remainingSeconds) {
      return new VerifiedToken(true, false, rut, expiresAtMillis, remainingSeconds, "Credencial vigente.");
    }

    public static VerifiedToken expired(String rut, long expiresAtMillis) {
      return new VerifiedToken(false, true, rut, expiresAtMillis, 0, "El código QR expiró.");
    }

    public static VerifiedToken invalid(String message) {
      return new VerifiedToken(false, false, "", 0, 0, message);
    }
  }
}
