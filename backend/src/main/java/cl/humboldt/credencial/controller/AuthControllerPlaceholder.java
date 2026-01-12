package cl.humboldt.credencial.controller;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Registro /api/auth/register (MVP).
 *
 * IMPORTANTÍSIMO:
 * - NO toca el POM.
 * - NO modifica members.json.
 * - Lee el padrón DIRECTAMENTE desde classpath: src/main/resources/members.json
 */
@RestController
@RequestMapping("/api/auth")
public class AuthControllerPlaceholder {

  private static final Logger log = LoggerFactory.getLogger(AuthControllerPlaceholder.class);
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Value("${app.upload-dir:uploads}")
  private String uploadDir;

  @JsonIgnoreProperties(ignoreUnknown = true)
  static class PadronMember {
    @JsonProperty("rut")
    public String rut;

    @JsonProperty("name")
    public String name;

    @JsonProperty("section")
    public String section;

    @JsonProperty("active")
    public boolean active;
  }

  @PostMapping(
      value = "/register",
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> register(
      @RequestParam String displayName,
      @RequestParam String rut,
      @RequestParam String password,
      @RequestPart(required = false) MultipartFile photo
  ) throws Exception {

    if (!existsByRutAndName(rut, displayName)) {
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "No encontramos tu nombre y RUT en el padrón del sindicato."
      ));
    }

    // hash password (MVP)
    BCrypt.hashpw(password, BCrypt.gensalt(10));

    // guardar foto si viene
    String photoUrl = "";
    if (photo != null && !photo.isEmpty()) {
      String ext = StringUtils.getFilenameExtension(photo.getOriginalFilename());
      String filename = "profile_" + Instant.now().toEpochMilli() + "_" + UUID.randomUUID()
          + (ext != null ? ("." + ext) : ".jpg");

      Path dir = Paths.get(uploadDir);
      Files.createDirectories(dir);

      Path target = dir.resolve(filename);
      Files.copy(photo.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

      // esta ruta asume que ya tienes un FileController que sirve /api/files/**
      photoUrl = "/api/files/" + filename;
    }

    // generar credencialCode
    String credentialCode = "HUMB-" + String.format("%03d", (int) (Math.random() * 900 + 100));

    return ResponseEntity.ok(Map.of(
        "ok", true,
        "displayName", displayName,
        "rutMasked", maskRut(rut),
        "credentialCode", credentialCode,
        "photoUrl", photoUrl
    ));
  }

  // ----------------------
  // Validación padrón
  // ----------------------

  private boolean existsByRutAndName(String rut, String displayName) {
    String rutNorm = normalizeRut(rut);
    String nameNorm = normalizeName(displayName);

    if (rutNorm.isEmpty() || nameNorm.isEmpty()) return false;

    Optional<PadronMember> m = loadPadron().stream()
        .filter(x -> x != null && x.active)
        .filter(x -> rutNorm.equals(normalizeRut(x.rut)))
        .filter(x -> nameNorm.equals(normalizeName(x.name)))
        .findFirst();

    if (m.isEmpty()) {
      // Log útil para depurar sin romper nada
      log.info("Padrón: no match para rut={} name={}", rutNorm, nameNorm);
      return false;
    }

    return true;
  }

  private List<PadronMember> loadPadron() {
    try {
      ClassPathResource resource = new ClassPathResource("members.json");
      return objectMapper.readValue(resource.getInputStream(), new TypeReference<List<PadronMember>>() {});
    } catch (IOException e) {
      log.error("No se pudo leer members.json desde classpath", e);
      return Collections.emptyList();
    }
  }

  private String normalizeRut(String rut) {
    if (rut == null) return "";
    // saca puntos/espacios, deja dígitos + K + guion
    String r = rut.trim().toUpperCase(Locale.ROOT).replace(".", "").replace(" ", "");
    r = r.replaceAll("[^0-9K-]", "");

    // si tiene guion, normaliza a NUM-DV
    if (r.contains("-")) {
      r = r.replaceAll("-+", "-");
      String[] parts = r.split("-");
      if (parts.length >= 2) {
        String num = parts[0].replaceAll("[^0-9]", "");
        String dv = parts[1].replaceAll("[^0-9K]", "");
        if (dv.length() > 1) dv = dv.substring(0, 1);
        if (!num.isEmpty() && !dv.isEmpty()) return num + "-" + dv;
        if (!num.isEmpty()) return num;
      }
    }

    // sin guion: separa último char como DV
    String clean = r.replaceAll("[^0-9K]", "");
    if (clean.length() >= 2) {
      String num = clean.substring(0, clean.length() - 1);
      String dv = clean.substring(clean.length() - 1);
      return num + "-" + dv;
    }

    return clean;
  }

  private String normalizeName(String name) {
    if (name == null) return "";
    // trim + colapsa espacios + lower
    String s = name.trim().replaceAll("\\s+", " ");
    return s.toLowerCase(Locale.ROOT);
  }

  private String maskRut(String rut) {
    String clean = rut == null ? "" : rut.replace(".", "").trim();
    if (clean.length() < 4) return "****";
    return clean.substring(0, Math.min(6, clean.length())) + ".***-*";
  }
}