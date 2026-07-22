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
@RequestMapping("/api/admin/library")
public class AdminLibraryController {

  private static final String OCI_LIBRARY_FOLDER = "hbdt/library";

  private final JdbcTemplate jdbc;
  private final StorageService storageService;
  private final InstitutionResolver institutionResolver;

  @Value("${app.library-upload-dir:uploads/library}")
  private String uploadDir;

  public AdminLibraryController(
      JdbcTemplate jdbc,
      StorageService storageService,
      InstitutionResolver institutionResolver
  ) {
    this.jdbc = jdbc;
    this.storageService = storageService;
    this.institutionResolver = institutionResolver;
  }

  @PostConstruct
  public void ensureTable() {
    jdbc.execute("""
        CREATE TABLE IF NOT EXISTS library_documents (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          institucion_id BIGINT NOT NULL,
          title VARCHAR(180) NOT NULL,
          description VARCHAR(1000),
          category VARCHAR(80) NOT NULL,
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
      @RequestParam(required = false) String category,
      HttpServletRequest request
  ) {
    Long institutionId = institutionResolver.resolveInstitutionId(request);
    String search = clean(q);
    String cleanCategory = clean(category);

    StringBuilder sql = new StringBuilder("""
        SELECT id, title, description, category, pdf_filename,
               pdf_original_name, active, created_at, updated_at
        FROM library_documents
        WHERE institucion_id = ?
        """);

    java.util.ArrayList<Object> params = new java.util.ArrayList<>();
    params.add(institutionId);

    if (!search.isBlank()) {
      sql.append("""
           AND (
             title LIKE ?
             OR description LIKE ?
             OR category LIKE ?
           )
          """);
      String like = "%" + search + "%";
      params.add(like);
      params.add(like);
      params.add(like);
    }

    if (!cleanCategory.isBlank()) {
      sql.append(" AND category = ? ");
      params.add(cleanCategory);
    }

    sql.append(" ORDER BY active DESC, category ASC, title ASC");

    List<Map<String, Object>> documents =
        jdbc.queryForList(sql.toString(), params.toArray())
            .stream()
            .map(this::toDto)
            .toList();

    return Map.of(
        "ok", true,
        "documents", documents,
        "count", documents.size()
    );
  }

  @PostMapping(consumes = {"multipart/form-data"})
  public Map<String, Object> save(
      @RequestParam(required = false) Long id,
      @RequestParam String title,
      @RequestParam(required = false) String description,
      @RequestParam String category,
      @RequestParam(defaultValue = "true") boolean active,
      @RequestPart(required = false) MultipartFile pdf,
      HttpServletRequest request
  ) throws Exception {

    Long institutionId = institutionResolver.resolveInstitutionId(request);

    String cleanTitle = clean(title);
    String cleanDescription = clean(description);
    String cleanCategory = clean(category);

    if (cleanTitle.isBlank()) {
      return error("El título es obligatorio.");
    }

    if (cleanTitle.length() > 180) {
      return error("El título no puede superar 180 caracteres.");
    }

    if (cleanDescription.length() > 1000) {
      return error("La descripción no puede superar 1000 caracteres.");
    }

    if (cleanCategory.isBlank()) {
      return error("La categoría es obligatoria.");
    }

    if (cleanCategory.length() > 80) {
      return error("La categoría no puede superar 80 caracteres.");
    }

    boolean editing = id != null && id > 0;
    String previousStoredName = "";

    if (editing) {
      List<Map<String, Object>> existing = jdbc.queryForList("""
          SELECT pdf_filename
          FROM library_documents
          WHERE id = ? AND institucion_id = ?
          LIMIT 1
          """, id, institutionId);

      if (existing.isEmpty()) {
        return error("El documento no existe.");
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
          storageService.upload("institucion/" + institutionId + "/library", pdf);

      newOriginalName =
          safeOriginalName(pdf.getOriginalFilename());
    }

    try {
      if (!editing) {
        jdbc.update("""
            INSERT INTO library_documents (
              institucion_id,
              title,
              description,
              category,
              pdf_filename,
              pdf_original_name,
              active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            institutionId,
            cleanTitle,
            cleanDescription,
            cleanCategory,
            newStoredName,
            newOriginalName,
            active
        );
      } else if (newStoredName == null) {
        jdbc.update("""
            UPDATE library_documents
            SET title = ?,
                description = ?,
                category = ?,
                active = ?
            WHERE id = ? AND institucion_id = ?
            """,
            cleanTitle,
            cleanDescription,
            cleanCategory,
            active,
            id,
            institutionId
        );
      } else {
        jdbc.update("""
            UPDATE library_documents
            SET title = ?,
                description = ?,
                category = ?,
                pdf_filename = ?,
                pdf_original_name = ?,
                active = ?
            WHERE id = ? AND institucion_id = ?
            """,
            cleanTitle,
            cleanDescription,
            cleanCategory,
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

    if (
        editing &&
        newStoredName != null &&
        !previousStoredName.isBlank() &&
        !previousStoredName.equals(newStoredName)
    ) {
      safeDeleteStoredFile(previousStoredName);
    }

    return Map.of(
        "ok", true,
        "message", editing
            ? "Documento actualizado correctamente."
            : "Documento creado correctamente."
    );
  }

  @DeleteMapping("/{id}")
  public Map<String, Object> delete(@PathVariable Long id, HttpServletRequest request) {
    Long institutionId = institutionResolver.resolveInstitutionId(request);
    List<Map<String, Object>> rows = jdbc.queryForList("""
        SELECT pdf_filename
        FROM library_documents
        WHERE id = ? AND institucion_id = ?
        LIMIT 1
        """, id, institutionId);

    if (rows.isEmpty()) {
      return error("El documento no existe.");
    }

    String storedName =
        stringValue(rows.get(0).get("pdf_filename"));

    jdbc.update(
        "DELETE FROM library_documents WHERE id = ? AND institucion_id = ?",
        id, institutionId
    );

    if (!storedName.isBlank()) {
      safeDeleteStoredFile(storedName);
    }

    return Map.of(
        "ok", true,
        "message", "Documento eliminado."
    );
  }

  private boolean isPdf(MultipartFile file) {
    String contentType = file.getContentType() == null
        ? ""
        : file.getContentType().trim().toLowerCase(Locale.ROOT);

    String originalName = file.getOriginalFilename() == null
        ? ""
        : file.getOriginalFilename().trim().toLowerCase(Locale.ROOT);

    return contentType.equals("application/pdf")
        || originalName.endsWith(".pdf");
  }

  private void safeDeleteStoredFile(String storedName) {
    try {
      if (storedName.startsWith(OCI_LIBRARY_FOLDER + "/")) {
        storageService.delete(storedName);
        return;
      }

      Path base = Path.of(uploadDir).toAbsolutePath().normalize();
      Path file = base.resolve(storedName).normalize();

      if (file.startsWith(base)) {
        Files.deleteIfExists(file);
      }
    } catch (Exception ignored) {
    }
  }

  private Map<String, Object> toDto(Map<String, Object> row) {
    Map<String, Object> dto = new LinkedHashMap<>();

    Long id = longValue(row.get("id"));
    String pdf = stringValue(row.get("pdf_filename"));

    dto.put("id", id);
    dto.put("title", stringValue(row.get("title")));
    dto.put("description", stringValue(row.get("description")));
    dto.put("category", stringValue(row.get("category")));
    dto.put("active", boolValue(row.get("active")));
    dto.put("hasPdf", !pdf.isBlank());
    dto.put(
        "pdfUrl",
        pdf.isBlank() ? "" : "/api/library/" + id + "/pdf"
    );
    dto.put(
        "pdfOriginalName",
        stringValue(row.get("pdf_original_name"))
    );
    dto.put("createdAt", stringValue(row.get("created_at")));
    dto.put("updatedAt", stringValue(row.get("updated_at")));

    return dto;
  }

  private String clean(String value) {
    return value == null
        ? ""
        : value.trim().replaceAll("\\s+", " ");
  }

  private String safeOriginalName(String value) {
    String name = value == null
        ? "documento.pdf"
        : value.replaceAll("[\\r\\n\\\\/\"]+", "_").trim();

    if (name.isBlank()) {
      return "documento.pdf";
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
