package cl.humboldt.credencial.controller;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/benefits")
public class AdminBenefitsController {

  private final JdbcTemplate jdbc;

  @Value("${app.benefits-upload-dir:uploads/benefits}")
  private String uploadDir;

  public AdminBenefitsController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @PostConstruct
  public void ensureTables() {
    jdbc.execute("""
        CREATE TABLE IF NOT EXISTS benefits (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(160) NOT NULL,
          zone VARCHAR(20) NOT NULL,
          short_info VARCHAR(500) NOT NULL,
          pdf_filename VARCHAR(255),
          pdf_original_name VARCHAR(255),
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """);
  }

  @GetMapping
  public Map<String, Object> list(@RequestParam(required = false) String q) {
    String search = q == null ? "" : q.trim();
    List<Map<String, Object>> rows;

    if (search.isBlank()) {
      rows = jdbc.queryForList("""
          SELECT id, title, zone, short_info, pdf_filename, pdf_original_name, active, created_at, updated_at
          FROM benefits
          ORDER BY active DESC, zone ASC, title ASC
          """);
    } else {
      String like = "%" + search + "%";
      rows = jdbc.queryForList("""
          SELECT id, title, zone, short_info, pdf_filename, pdf_original_name, active, created_at, updated_at
          FROM benefits
          WHERE title LIKE ? OR short_info LIKE ? OR zone LIKE ?
          ORDER BY active DESC, zone ASC, title ASC
          """, like, like, like);
    }

    List<Map<String, Object>> benefits = rows.stream().map(this::toDto).toList();
    return Map.of("ok", true, "benefits", benefits, "count", benefits.size());
  }

  @PostMapping(consumes = {"multipart/form-data"})
  public Map<String, Object> save(
      @RequestParam(required = false) Long id,
      @RequestParam String title,
      @RequestParam String zone,
      @RequestParam String shortInfo,
      @RequestParam(defaultValue = "true") boolean active,
      @RequestPart(required = false) MultipartFile pdf
  ) throws Exception {
    String cleanTitle = clean(title);
    String cleanZone = normalizeZone(zone);
    String cleanInfo = clean(shortInfo);

    if (cleanTitle.isBlank()) return Map.of("ok", false, "message", "El título es obligatorio.");
    if (cleanZone.isBlank()) return Map.of("ok", false, "message", "La zona debe ser NORTE o SUR.");
    if (cleanInfo.isBlank()) return Map.of("ok", false, "message", "La información corta es obligatoria.");
    if (cleanInfo.length() > 500) return Map.of("ok", false, "message", "La información corta no puede superar 500 caracteres.");

    String storedName = null;
    String originalName = null;

    if (pdf != null && !pdf.isEmpty()) {
      String contentType = pdf.getContentType() == null ? "" : pdf.getContentType().toLowerCase();
      String original = pdf.getOriginalFilename() == null ? "beneficio.pdf" : pdf.getOriginalFilename();

      if (!contentType.contains("pdf") && !original.toLowerCase().endsWith(".pdf")) {
        return Map.of("ok", false, "message", "Solo se permiten archivos PDF.");
      }

      Path dir = Path.of(uploadDir).toAbsolutePath().normalize();
      Files.createDirectories(dir);

      storedName = UUID.randomUUID() + ".pdf";
      originalName = safeName(original);
      Files.copy(pdf.getInputStream(), dir.resolve(storedName), StandardCopyOption.REPLACE_EXISTING);
    }

    if (id == null || id <= 0) {
      jdbc.update("""
          INSERT INTO benefits (title, zone, short_info, pdf_filename, pdf_original_name, active)
          VALUES (?, ?, ?, ?, ?, ?)
          """, cleanTitle, cleanZone, cleanInfo, storedName, originalName, active);
    } else {
      if (storedName == null) {
        jdbc.update("""
            UPDATE benefits
            SET title = ?, zone = ?, short_info = ?, active = ?
            WHERE id = ?
            """, cleanTitle, cleanZone, cleanInfo, active, id);
      } else {
        jdbc.update("""
            UPDATE benefits
            SET title = ?, zone = ?, short_info = ?, pdf_filename = ?, pdf_original_name = ?, active = ?
            WHERE id = ?
            """, cleanTitle, cleanZone, cleanInfo, storedName, originalName, active, id);
      }
    }

    return Map.of("ok", true, "message", "Beneficio guardado correctamente.");
  }

  @DeleteMapping("/{id}")
  public Map<String, Object> delete(@PathVariable Long id) {
    jdbc.update("DELETE FROM benefits WHERE id = ?", id);
    return Map.of("ok", true, "message", "Beneficio eliminado.");
  }

  private Map<String, Object> toDto(Map<String, Object> row) {
    Map<String, Object> dto = new LinkedHashMap<>();
    Long id = longValue(row.get("id"));
    String pdf = stringValue(row.get("pdf_filename"));

    dto.put("id", id);
    dto.put("title", stringValue(row.get("title")));
    dto.put("zone", stringValue(row.get("zone")));
    dto.put("shortInfo", stringValue(row.get("short_info")));
    dto.put("active", boolValue(row.get("active")));
    dto.put("hasPdf", !pdf.isBlank());
    dto.put("pdfUrl", pdf.isBlank() ? "" : "/api/benefits/" + id + "/pdf");
    dto.put("pdfOriginalName", stringValue(row.get("pdf_original_name")));
    dto.put("createdAt", stringValue(row.get("created_at")));
    dto.put("updatedAt", stringValue(row.get("updated_at")));
    return dto;
  }

  private String normalizeZone(String value) {
    String text = clean(value).toUpperCase();
    if (text.equals("NORTE")) return "NORTE";
    if (text.equals("SUR") || text.equals("ZUR")) return "SUR";
    return "";
  }

  private String clean(String value) {
    return value == null ? "" : value.trim().replaceAll("\\s+", " ");
  }

  private String safeName(String value) {
    String clean = value == null ? "beneficio.pdf" : value.replaceAll("[\\r\\n\\\\/]+", "_").trim();
    return clean.isBlank() ? "beneficio.pdf" : clean;
  }

  private String stringValue(Object value) { return value == null ? "" : String.valueOf(value); }
  private Long longValue(Object value) {
    if (value instanceof Number n) return n.longValue();
    try { return Long.parseLong(String.valueOf(value)); } catch (Exception e) { return 0L; }
  }
  private boolean boolValue(Object value) {
    if (value instanceof Boolean b) return b;
    if (value instanceof Number n) return n.intValue() == 1;
    return "true".equalsIgnoreCase(String.valueOf(value)) || "1".equals(String.valueOf(value));
  }
}
