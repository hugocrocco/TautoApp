package cl.humboldt.credencial.controller;

import cl.humboldt.credencial.service.StorageService;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import cl.humboldt.credencial.tenant.InstitutionResolver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/benefits")
public class AdminBenefitsController {

  private static final String OCI_BENEFITS_FOLDER = "hbdt/benefits";

  private final JdbcTemplate jdbc;
  private final StorageService storageService;
  private final InstitutionResolver institutionResolver;

  @Value("${app.benefits-upload-dir:uploads/benefits}")
  private String uploadDir;

  public AdminBenefitsController(
      JdbcTemplate jdbc,
      StorageService storageService,
      InstitutionResolver institutionResolver
  ) {
    this.jdbc = jdbc;
    this.storageService = storageService;
    this.institutionResolver = institutionResolver;
  }

  @PostConstruct
  public void ensureTables() {
    jdbc.execute("""
        CREATE TABLE IF NOT EXISTS benefits (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          institucion_id BIGINT NOT NULL,
          title VARCHAR(160) NOT NULL,
          zone VARCHAR(20) NOT NULL,
          short_info VARCHAR(500) NOT NULL,
          pdf_filename VARCHAR(255),
          pdf_original_name VARCHAR(255),
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP
        )
        """);
  }

  @GetMapping
  public Map<String, Object> list(
      @RequestParam(required = false) String q,
      HttpServletRequest request
  ) {
    Long institutionId = institutionResolver.resolveInstitutionId(request);
    String search = clean(q);
    List<Map<String, Object>> rows;

    if (search.isBlank()) {
      rows = jdbc.queryForList("""
          SELECT id, title, zone, short_info, pdf_filename,
                 pdf_original_name, active, created_at, updated_at
          FROM benefits
          WHERE institucion_id = ?
          ORDER BY active DESC, zone ASC, title ASC
          """, institutionId);
    } else {
      String like = "%" + search + "%";

      rows = jdbc.queryForList("""
          SELECT id, title, zone, short_info, pdf_filename,
                 pdf_original_name, active, created_at, updated_at
          FROM benefits
          WHERE institucion_id = ?
            AND (title LIKE ? OR short_info LIKE ? OR zone LIKE ?)
          ORDER BY active DESC, zone ASC, title ASC
          """, institutionId, like, like, like);
    }

    List<Map<String, Object>> benefits = rows.stream()
        .map(this::toDto)
        .toList();

    return Map.of(
        "ok", true,
        "benefits", benefits,
        "count", benefits.size()
    );
  }

  @PostMapping(consumes = {"multipart/form-data"})
  public Map<String, Object> save(
      @RequestParam(required = false) Long id,
      @RequestParam String title,
      @RequestParam String zone,
      @RequestParam String shortInfo,
      @RequestParam(defaultValue = "true") boolean active,
      @RequestPart(required = false) MultipartFile pdf,
      HttpServletRequest request
  ) throws Exception {

    Long institutionId = institutionResolver.resolveInstitutionId(request);

    String cleanTitle = clean(title);
    String cleanZone = normalizeZone(zone);
    String cleanInfo = clean(shortInfo);

    if (cleanTitle.isBlank()) {
      return error("El título es obligatorio.");
    }

    if (cleanTitle.length() > 160) {
      return error("El título no puede superar 160 caracteres.");
    }

    if (cleanZone.isBlank()) {
      return error("La zona debe ser NORTE o SUR.");
    }

    if (cleanInfo.isBlank()) {
      return error("La información corta es obligatoria.");
    }

    if (cleanInfo.length() > 500) {
      return error(
          "La información corta no puede superar 500 caracteres."
      );
    }

    boolean editing = id != null && id > 0;
    String previousStoredName = "";

    if (editing) {
      List<Map<String, Object>> existing = jdbc.queryForList("""
          SELECT pdf_filename
          FROM benefits
          WHERE id = ? AND institucion_id = ?
          LIMIT 1
          """, id, institutionId);

      if (existing.isEmpty()) {
        return error("El beneficio que intentas editar no existe.");
      }

      previousStoredName =
          stringValue(existing.get(0).get("pdf_filename"));
    }

    String newStoredName = null;
    String newOriginalName = null;

    if (pdf != null && !pdf.isEmpty()) {
      if (!isPdf(pdf)) {
        return error("Solo se permiten archivos PDF.");
      }

      newStoredName =
          storageService.upload("institucion/" + institutionId + "/benefits", pdf);

      newOriginalName =
          safeOriginalName(pdf.getOriginalFilename());
    }

    try {
      if (!editing) {
        jdbc.update("""
            INSERT INTO benefits (
              institucion_id,
              title,
              zone,
              short_info,
              pdf_filename,
              pdf_original_name,
              active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            institutionId,
            cleanTitle,
            cleanZone,
            cleanInfo,
            newStoredName,
            newOriginalName,
            active
        );
      } else if (newStoredName == null) {
        jdbc.update("""
            UPDATE benefits
            SET title = ?,
                zone = ?,
                short_info = ?,
                active = ?
            WHERE id = ? AND institucion_id = ?
            """,
            cleanTitle,
            cleanZone,
            cleanInfo,
            active,
            id,
            institutionId
        );
      } else {
        jdbc.update("""
            UPDATE benefits
            SET title = ?,
                zone = ?,
                short_info = ?,
                pdf_filename = ?,
                pdf_original_name = ?,
                active = ?
            WHERE id = ? AND institucion_id = ?
            """,
            cleanTitle,
            cleanZone,
            cleanInfo,
            newStoredName,
            newOriginalName,
            active,
            id,
            institutionId
        );
      }
    } catch (Exception exception) {
      if (newStoredName != null) {
        safeDeleteStoredFile(newStoredName);
      }

      throw exception;
    }

    if (editing
        && newStoredName != null
        && !previousStoredName.isBlank()
        && !previousStoredName.equals(newStoredName)) {
      safeDeleteStoredFile(previousStoredName);
    }

    return Map.of(
        "ok", true,
        "message", "Beneficio guardado correctamente."
    );
  }

  @DeleteMapping("/{id}")
  public Map<String, Object> delete(@PathVariable Long id, HttpServletRequest request) {
    Long institutionId = institutionResolver.resolveInstitutionId(request);
    List<Map<String, Object>> rows = jdbc.queryForList("""
        SELECT pdf_filename
        FROM benefits
        WHERE id = ? AND institucion_id = ?
        LIMIT 1
        """, id, institutionId);

    if (rows.isEmpty()) {
      return error("El beneficio no existe.");
    }

    String storedName =
        stringValue(rows.get(0).get("pdf_filename"));

    jdbc.update(
        "DELETE FROM benefits WHERE id = ? AND institucion_id = ?",
        id, institutionId
    );

    if (!storedName.isBlank()) {
      safeDeleteStoredFile(storedName);
    }

    return Map.of(
        "ok", true,
        "message", "Beneficio eliminado."
    );
  }

  private boolean isPdf(MultipartFile file) {
    String contentType = file.getContentType() == null
        ? ""
        : file.getContentType()
            .trim()
            .toLowerCase(Locale.ROOT);

    String originalName = file.getOriginalFilename() == null
        ? ""
        : file.getOriginalFilename()
            .trim()
            .toLowerCase(Locale.ROOT);

    return contentType.equals("application/pdf")
        || originalName.endsWith(".pdf");
  }

  private void safeDeleteStoredFile(String storedName) {
    try {
      if (storedName.startsWith(OCI_BENEFITS_FOLDER + "/")) {
        storageService.delete(storedName);
        return;
      }

      /*
       * Compatibilidad con archivos antiguos que todavía estén
       * guardados en uploads/benefits.
       */
      Path base = Path.of(uploadDir)
          .toAbsolutePath()
          .normalize();

      Path file = base.resolve(storedName).normalize();

      if (file.startsWith(base)) {
        Files.deleteIfExists(file);
      }
    } catch (Exception ignored) {
      /*
       * No impedimos que la operación de base de datos termine
       * si falla la eliminación física de un archivo antiguo.
       */
    }
  }

  private Map<String, Object> toDto(
      Map<String, Object> row
  ) {
    Map<String, Object> dto = new LinkedHashMap<>();

    Long id = longValue(row.get("id"));
    String pdf = stringValue(row.get("pdf_filename"));

    dto.put("id", id);
    dto.put("title", stringValue(row.get("title")));
    dto.put("zone", stringValue(row.get("zone")));
    dto.put(
        "shortInfo",
        stringValue(row.get("short_info"))
    );
    dto.put("active", boolValue(row.get("active")));
    dto.put("hasPdf", !pdf.isBlank());
    dto.put(
        "pdfUrl",
        pdf.isBlank()
            ? ""
            : "/api/benefits/" + id + "/pdf"
    );
    dto.put(
        "pdfOriginalName",
        stringValue(row.get("pdf_original_name"))
    );
    dto.put(
        "createdAt",
        stringValue(row.get("created_at"))
    );
    dto.put(
        "updatedAt",
        stringValue(row.get("updated_at"))
    );

    return dto;
  }

  private String normalizeZone(String value) {
    String text = clean(value).toUpperCase(Locale.ROOT);

    if (text.equals("NORTE")) {
      return "NORTE";
    }

    if (text.equals("SUR") || text.equals("ZUR")) {
      return "SUR";
    }

    return "";
  }

  private String clean(String value) {
    return value == null
        ? ""
        : value.trim().replaceAll("\\s+", " ");
  }

  private String safeOriginalName(String value) {
    String name = value == null
        ? "beneficio.pdf"
        : value
            .replaceAll("[\\r\\n\\\\/\"]+", "_")
            .trim();

    if (name.isBlank()) {
      return "beneficio.pdf";
    }

    if (name.length() > 255) {
      return name.substring(name.length() - 255);
    }

    return name;
  }

  private Map<String, Object> error(String message) {
    return Map.of(
        "ok", false,
        "message", message
    );
  }

  private String stringValue(Object value) {
    return value == null ? "" : String.valueOf(value);
  }

  private Long longValue(Object value) {
    if (value instanceof Number number) {
      return number.longValue();
    }

    try {
      return Long.parseLong(String.valueOf(value));
    } catch (Exception exception) {
      return 0L;
    }
  }

  private boolean boolValue(Object value) {
    if (value instanceof Boolean booleanValue) {
      return booleanValue;
    }

    if (value instanceof Number number) {
      return number.intValue() == 1;
    }

    return "true".equalsIgnoreCase(String.valueOf(value))
        || "1".equals(String.valueOf(value));
  }
}