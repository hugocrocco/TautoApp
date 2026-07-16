package cl.humboldt.credencial.controller;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/benefits")
public class BenefitsController {

  private final JdbcTemplate jdbc;

  @Value("${app.benefits-upload-dir:uploads/benefits}")
  private String uploadDir;

  public BenefitsController(JdbcTemplate jdbc) {
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
  public Map<String, Object> list(@RequestParam(required = false) String zone) {
    String z = normalizeZone(zone);
    List<Map<String, Object>> rows;

    if (z.isBlank()) {
      rows = jdbc.queryForList("""
          SELECT id, title, zone, short_info, pdf_filename, pdf_original_name, active, created_at, updated_at
          FROM benefits
          WHERE active = TRUE
          ORDER BY zone ASC, title ASC
          """);
    } else {
      rows = jdbc.queryForList("""
          SELECT id, title, zone, short_info, pdf_filename, pdf_original_name, active, created_at, updated_at
          FROM benefits
          WHERE active = TRUE AND zone = ?
          ORDER BY title ASC
          """, z);
    }

    List<Map<String, Object>> benefits = rows.stream().map(this::toDto).toList();

    return Map.of(
        "ok", true,
        "benefits", benefits,
        "count", benefits.size()
    );
  }

  @GetMapping("/{id}/pdf")
  public ResponseEntity<Resource> downloadPdf(@PathVariable Long id) throws MalformedURLException {
    List<Map<String, Object>> rows = jdbc.queryForList("""
        SELECT pdf_filename, pdf_original_name
        FROM benefits
        WHERE id = ? AND active = TRUE
        LIMIT 1
        """, id);

    if (rows.isEmpty()) {
      return ResponseEntity.notFound().build();
    }

    String fileName = stringValue(rows.get(0).get("pdf_filename"));
    String originalName = stringValue(rows.get(0).get("pdf_original_name"));

    if (fileName.isBlank()) {
      return ResponseEntity.notFound().build();
    }

    Path base = Path.of(uploadDir).toAbsolutePath().normalize();
    Path file = base.resolve(fileName).normalize();

    if (!file.startsWith(base) || !Files.exists(file)) {
      return ResponseEntity.notFound().build();
    }

    Resource resource = new UrlResource(file.toUri());
    String downloadName = originalName.isBlank() ? fileName : originalName;

    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_PDF)
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeDownloadName(downloadName) + "\"")
        .body(resource);
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

  private String safeDownloadName(String value) {
    String clean = value == null ? "beneficio.pdf" : value.replaceAll("[\\r\\n\\\\/]+", "_").trim();
    return clean.isBlank() ? "beneficio.pdf" : clean;
  }

  private String stringValue(Object value) {
    return value == null ? "" : String.valueOf(value);
  }

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
