package cl.humboldt.credencial.util;

import java.util.Locale;

public final class RutUtils {

  private RutUtils() {
  }

  /**
   * Convierte cualquiera de estos formatos:
   * 16.664.641-3
   * 16664641-3
   * 166646413
   *
   * al formato único:
   * 16664641-3
   */
  public static String normalize(String rut) {
    if (rut == null) {
      return "";
    }

    String clean = rut
        .trim()
        .toUpperCase(Locale.ROOT)
        .replaceAll("[^0-9K]", "");

    if (clean.length() < 2) {
      return "";
    }

    String body = clean.substring(0, clean.length() - 1);
    String verifier = clean.substring(clean.length() - 1);

    if (!body.matches("\\d+")) {
      return "";
    }

    return body + "-" + verifier;
  }

  /**
   * Comprueba matemáticamente el dígito verificador.
   */
  public static boolean isValid(String rut) {
    String normalized = normalize(rut);

    if (normalized.isEmpty()) {
      return false;
    }

    String[] parts = normalized.split("-");

    if (parts.length != 2 || parts[0].isBlank() || parts[1].isBlank()) {
      return false;
    }

    String body = parts[0];
    char providedVerifier = parts[1].charAt(0);

    int sum = 0;
    int multiplier = 2;

    for (int i = body.length() - 1; i >= 0; i--) {
      int digit = Character.digit(body.charAt(i), 10);

      if (digit < 0) {
        return false;
      }

      sum += digit * multiplier;
      multiplier = multiplier == 7 ? 2 : multiplier + 1;
    }

    int result = 11 - (sum % 11);

    char expectedVerifier;

    if (result == 11) {
      expectedVerifier = '0';
    } else if (result == 10) {
      expectedVerifier = 'K';
    } else {
      expectedVerifier = Character.forDigit(result, 10);
    }

    return providedVerifier == expectedVerifier;
  }

  /**
   * Devuelve el RUT con puntos para mostrarlo en pantalla.
   * La base de datos debe usar normalize().
   */
  public static String format(String rut) {
    String normalized = normalize(rut);

    if (normalized.isEmpty()) {
      return "";
    }

    String[] parts = normalized.split("-");
    String body = parts[0];
    String verifier = parts[1];

    StringBuilder formatted = new StringBuilder();
    int digitsSinceDot = 0;

    for (int i = body.length() - 1; i >= 0; i--) {
      if (digitsSinceDot == 3) {
        formatted.append('.');
        digitsSinceDot = 0;
      }

      formatted.append(body.charAt(i));
      digitsSinceDot++;
    }

    return formatted.reverse() + "-" + verifier;
  }
}