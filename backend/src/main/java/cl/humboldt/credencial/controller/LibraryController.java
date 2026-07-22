package cl.humboldt.credencial.controller;

import cl.humboldt.credencial.service.StorageService;
import com.oracle.bmc.objectstorage.responses.GetObjectResponse;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import cl.humboldt.credencial.tenant.InstitutionResolver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
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
@RequestMapping("/api/library")
public class LibraryController {

  private static final String OCI_LIBRARY_FOLDER = "hbdt/library/";

  private final JdbcTemplate jdbc;
  private final StorageService storageService;
  private final InstitutionResolver institutionResolver;

  @Value("${app.library-upload-dir:uploads/library}")
  private String uploadDir;

  public LibraryController(
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
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String q,
      HttpServletRequest request
  ) {
    Long institutionId = institutionResolver.resolveInstitutionId(request);
    String cleanCategory = clean(category);
    String search = clean(q);

    StringBuilder sql = new StringBuilder("""
        SELECT id, title, description, category, pdf_filename,
               pdf_original_name, active, created_at, updated_at
        FROM library_documents
        WHERE institucion_id = ? AND active = TRUE
        """);

    java.util.ArrayList<Object> params = new java.util.ArrayList<>();
    params.add(institutionId);

    if (!cleanCategory.isBlank()) {
      sql.append(" AND category = ? ");
      params.add(cleanCategory);
    }

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

    sql.append(" ORDER BY category ASC, title ASC");

    List<Map<String, Object>> documents =
        jdbc.queryForList(sql.toString(), params.toArray())
            .stream()
            .map(this::toDto)
            .toList();

    List<String> categories = jdbc.queryForList("""
        SELECT DISTINCT category
        FROM library_documents
        WHERE institucion_id = ? AND active = TRUE
        ORDER BY category ASC
        """, String.class, institutionId);

    return Map.of(
        "ok", true,
        "documents", documents,
        "categories", categories,
        "count", documents.size()
    );
  }

  @GetMapping("/{id}/pdf")
  public ResponseEntity<Resource> downloadPdf(@PathVariable Long id, HttpServletRequest request) {
    Long institutionId = institutionResolver.resolveInstitutionId(request);
    List<Map<String, Object>> rows = jdbc.queryForList("""
        SELECT pdf_filename, pdf_original_name
        FROM library_documents
        WHERE id = ? AND institucion_id = ? AND active = TRUE
        LIMIT 1
        """, id, institutionId);

    if (rows.isEmpty()) {
      return ResponseEntity.notFound().build();
    }

    String storedName =
        stringValue(rows.get(0).get("pdf_filename"));

    String originalName =
        stringValue(rows.get(0).get("pdf_original_name"));

    if (storedName.isBlank()) {
      return ResponseEntity.notFound().build();
    }

    String downloadName = originalName.isBlank()
        ? fallbackDownloadName(storedName)
        : originalName;

    if (storedName.startsWith(OCI_LIBRARY_FOLDER)) {
      return downloadFromOci(storedName, downloadName);
    }

    return downloadLegacyLocalFile(storedName, downloadName);
  }

  private ResponseEntity<Resource> downloadFromOci(
      String objectName,
      String downloadName
  ) {
    try {
      if (!storageService.exists(objectName)) {
        return ResponseEntity.notFound().build();
      }

      GetObjectResponse response =
          storageService.download(objectName);

      InputStreamResource resource =
          new InputStreamResource(response.getInputStream());

      ResponseEntity.BodyBuilder builder = ResponseEntity.ok()
          .contentType(MediaType.APPLICATION_PDF)
          .header(
              HttpHeaders.CONTENT_DISPOSITION,
              contentDisposition(downloadName)
          );

      if (
          response.getContentLength() != null &&
          response.getContentLength() >= 0
      ) {
        builder.contentLength(response.getContentLength());
      }

      return builder.body(resource);

    } catch (Exception exception) {
      return ResponseEntity.internalServerError().build();
    }
  }

  private ResponseEntity<Resource> downloadLegacyLocalFile(
      String fileName,
      String downloadName
  ) {
    try {
      Path base = Path.of(uploadDir).toAbsolutePath().normalize();
      Path file = base.resolve(fileName).normalize();

      if (!file.startsWith(base) || !Files.exists(file)) {
        return ResponseEntity.notFound().build();
      }

      Resource resource = new UrlResource(file.toUri());

      return ResponseEntity.ok()
          .contentType(MediaType.APPLICATION_PDF)
          .header(
              HttpHeaders.CONTENT_DISPOSITION,
              contentDisposition(downloadName)
          )
          .contentLength(Files.size(file))
          .body(resource);

    } catch (MalformedURLException exception) {
      return ResponseEntity.internalServerError().build();

    } catch (Exception exception) {
      return ResponseEntity.internalServerError().build();
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

  private String contentDisposition(String fileName) {
    return "attachment; filename=\""
        + safeDownloadName(fileName)
        + "\"";
  }

  private String fallbackDownloadName(String storedName) {
    int slash = storedName.lastIndexOf('/');
    String fileName = slash >= 0
        ? storedName.substring(slash + 1)
        : storedName;

    return fileName.isBlank() ? "documento.pdf" : fileName;
  }

  private String safeDownloadName(String value) {
    String name = value == null
        ? "documento.pdf"
        : value.replaceAll("[\\r\\n\\\\/\"]+", "_").trim();

    return name.isBlank() ? "documento.pdf" : name;
  }

  private String clean(String value) {
    return value == null
        ? ""
        : value.trim().replaceAll("\\s+", " ");
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
}
