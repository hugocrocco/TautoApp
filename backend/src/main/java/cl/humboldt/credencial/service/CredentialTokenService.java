package cl.humboldt.credencial.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
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
            @Value("${app.credential-secret:${app.admin-key:hbdt}}")
            String secret,
            @Value("${app.credential-ttl-seconds:180}")
            long ttlSeconds
    ) {
        this.secret = secret == null || secret.isBlank()
                ? "hbdt"
                : secret;

        this.ttlSeconds = ttlSeconds > 0
                ? ttlSeconds
                : DEFAULT_TTL_SECONDS;
    }

    public GeneratedToken generate(
            Long institucionId,
            String rut
    ) {
        long expiresAtMillis = Instant.now()
                .plusSeconds(ttlSeconds)
                .toEpochMilli();

        String payload =
                institucionId + "|" +
                rut + "|" +
                expiresAtMillis + "|" +
                randomNonce();

        String encodedPayload = base64Url(
                payload.getBytes(StandardCharsets.UTF_8)
        );

        String token = encodedPayload + "." + sign(encodedPayload);

        return new GeneratedToken(
                token,
                expiresAtMillis,
                ttlSeconds
        );
    }

    public VerifiedToken verify(String token) {
        if (token == null
                || token.isBlank()
                || !token.contains(".")) {
            return VerifiedToken.invalid("Token inválido.");
        }

        String[] tokenParts = token.split("\\.", 2);

        if (tokenParts.length != 2) {
            return VerifiedToken.invalid("Token inválido.");
        }

        String encodedPayload = tokenParts[0];
        String receivedSignature = tokenParts[1];
        String expectedSignature = sign(encodedPayload);

        if (!constantTimeEquals(
                receivedSignature,
                expectedSignature
        )) {
            return VerifiedToken.invalid("Firma inválida.");
        }

        String payload;

        try {
            payload = new String(
                    Base64.getUrlDecoder().decode(encodedPayload),
                    StandardCharsets.UTF_8
            );
        } catch (IllegalArgumentException exception) {
            return VerifiedToken.invalid("Token ilegible.");
        }

        String[] values = payload.split("\\|", 4);

        if (values.length < 4) {
            return VerifiedToken.invalid("Token incompleto.");
        }

        Long institucionId;
        long expiresAtMillis;

        try {
            institucionId = Long.parseLong(values[0]);
            expiresAtMillis = Long.parseLong(values[2]);
        } catch (NumberFormatException exception) {
            return VerifiedToken.invalid("Token inválido.");
        }

        long now = Instant.now().toEpochMilli();

        long remainingSeconds = Math.max(
                0L,
                (expiresAtMillis - now) / 1000L
        );

        if (expiresAtMillis <= now) {
            return VerifiedToken.expired(
                    institucionId,
                    values[1],
                    expiresAtMillis
            );
        }

        return VerifiedToken.valid(
                institucionId,
                values[1],
                expiresAtMillis,
                remainingSeconds
        );
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");

            mac.init(
                    new SecretKeySpec(
                            secret.getBytes(StandardCharsets.UTF_8),
                            "HmacSHA256"
                    )
            );

            return base64Url(
                    mac.doFinal(
                            value.getBytes(StandardCharsets.UTF_8)
                    )
            );
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "No fue posible firmar el token.",
                    exception
            );
        }
    }

    private String randomNonce() {
        byte[] bytes = new byte[12];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private boolean constantTimeEquals(
            String first,
            String second
    ) {
        if (first == null || second == null) {
            return false;
        }

        return MessageDigest.isEqual(
                first.getBytes(StandardCharsets.UTF_8),
                second.getBytes(StandardCharsets.UTF_8)
        );
    }

    public record GeneratedToken(
            String token,
            long expiresAtMillis,
            long ttlSeconds
    ) {
    }

    public record VerifiedToken(
            boolean valid,
            boolean expired,
            Long institucionId,
            String rut,
            long expiresAtMillis,
            long remainingSeconds,
            String message
    ) {

        public static VerifiedToken valid(
                Long institucionId,
                String rut,
                long expiresAtMillis,
                long remainingSeconds
        ) {
            return new VerifiedToken(
                    true,
                    false,
                    institucionId,
                    rut,
                    expiresAtMillis,
                    remainingSeconds,
                    "Credencial vigente."
            );
        }

        public static VerifiedToken expired(
                Long institucionId,
                String rut,
                long expiresAtMillis
        ) {
            return new VerifiedToken(
                    false,
                    true,
                    institucionId,
                    rut,
                    expiresAtMillis,
                    0,
                    "El código QR expiró."
            );
        }

        public static VerifiedToken invalid(String message) {
            return new VerifiedToken(
                    false,
                    false,
                    null,
                    "",
                    0,
                    0,
                    message
            );
        }
    }
}
