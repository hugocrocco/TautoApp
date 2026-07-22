package cl.humboldt.credencial.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/activity")
public class ActivityMonitorController {

  private static final DateTimeFormatter FILE_DATE =
      DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

  private final JdbcTemplate jdbc;

  public ActivityMonitorController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @GetMapping("/dashboard")
  public Map<String, Object> dashboard(
      @RequestHeader(value = "X-Institution-Code", required = false) String institutionCode,
      @RequestParam(defaultValue = "DAILY") String period
  ) {
    Long institutionId = resolveInstitutionId(institutionCode);
    String normalizedPeriod = normalizePeriod(period);

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("ok", true);
    response.put("period", normalizedPeriod);
    response.put("retentionMonths", 12);
    response.put("summary", loadSummary(institutionId));
    response.put("series", loadSeries(institutionId, normalizedPeriod));
    response.put("recentActivity", loadRecentActivity(institutionId));
    response.put("topFailedIps", loadTopFailedIps(institutionId));

    return response;
  }

  @GetMapping("/export")
  public ResponseEntity<byte[]> exportCsv(
      @RequestHeader(value = "X-Institution-Code", required = false) String institutionCode,
      @RequestParam(defaultValue = "12") int months
  ) {
    Long institutionId = resolveInstitutionId(institutionCode);
    int safeMonths = Math.max(1, Math.min(months, 12));

    List<Map<String, Object>> rows = jdbc.queryForList("""
        SELECT
          created_at,
          rut,
          display_name,
          event_type,
          result,
          ip_address,
          user_agent,
          details
        FROM activity_events
        WHERE institucion_id = ?
          AND created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
        ORDER BY created_at DESC
        """, institutionId, safeMonths);

    StringBuilder csv = new StringBuilder();
    csv.append('\uFEFF');
    csv.append("Fecha,RUT,Nombre,Tipo de evento,Resultado,IP,Navegador,Detalle\r\n");

    for (Map<String, Object> row : rows) {
      appendCsvRow(
          csv,
          value(row.get("created_at")),
          value(row.get("rut")),
          value(row.get("display_name")),
          value(row.get("event_type")),
          value(row.get("result")),
          value(row.get("ip_address")),
          value(row.get("user_agent")),
          value(row.get("details"))
      );
    }

    byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
    String filename = "actividad-" + FILE_DATE.format(LocalDateTime.now()) + ".csv";

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + filename + "\"")
        .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
        .contentLength(bytes.length)
        .body(bytes);
  }

  private Map<String, Object> loadSummary(Long institutionId) {
    Map<String, Object> summary = new LinkedHashMap<>();

    summary.put("eventsToday", queryCount("""
        SELECT COUNT(*)
        FROM activity_events
        WHERE institucion_id = ?
          AND created_at >= CURDATE()
        """, institutionId));

    summary.put("loginSuccessToday", queryCount("""
        SELECT COUNT(*)
        FROM activity_events
        WHERE institucion_id = ?
          AND event_type = 'LOGIN_SUCCESS'
          AND created_at >= CURDATE()
        """, institutionId));

    summary.put("loginFailedToday", queryCount("""
        SELECT COUNT(*)
        FROM activity_events
        WHERE institucion_id = ?
          AND event_type IN ('LOGIN_FAILED', 'LOGIN_BLOCKED')
          AND created_at >= CURDATE()
        """, institutionId));

    summary.put("qrGeneratedToday", queryCount("""
        SELECT COUNT(*)
        FROM activity_events
        WHERE institucion_id = ?
          AND event_type = 'QR_GENERATED'
          AND created_at >= CURDATE()
        """, institutionId));

    summary.put("qrVerifiedToday", queryCount("""
        SELECT COUNT(*)
        FROM activity_events
        WHERE institucion_id = ?
          AND event_type = 'QR_VERIFIED'
          AND result = 'SUCCESS'
          AND created_at >= CURDATE()
        """, institutionId));

    summary.put("uniqueUsersToday", queryCount("""
        SELECT COUNT(DISTINCT rut)
        FROM activity_events
        WHERE institucion_id = ?
          AND rut IS NOT NULL
          AND rut <> ''
          AND created_at >= CURDATE()
        """, institutionId));

    return summary;
  }

  private List<Map<String, Object>> loadSeries(
      Long institutionId,
      String period
  ) {
    return switch (period) {
      case "WEEKLY" -> jdbc.queryForList("""
          SELECT
            DATE_FORMAT(
              DATE_SUB(DATE(created_at), INTERVAL WEEKDAY(created_at) DAY),
              '%Y-%m-%d'
            ) AS label,
            COUNT(*) AS total,
            SUM(event_type = 'LOGIN_SUCCESS') AS login_success,
            SUM(event_type IN ('LOGIN_FAILED', 'LOGIN_BLOCKED')) AS login_failed,
            SUM(event_type = 'QR_GENERATED') AS qr_generated,
            SUM(event_type = 'QR_VERIFIED' AND result = 'SUCCESS') AS qr_verified
          FROM activity_events
          WHERE institucion_id = ?
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
          GROUP BY DATE_SUB(DATE(created_at), INTERVAL WEEKDAY(created_at) DAY)
          ORDER BY DATE_SUB(DATE(created_at), INTERVAL WEEKDAY(created_at) DAY)
          """, institutionId);

      case "MONTHLY" -> jdbc.queryForList("""
          SELECT
            DATE_FORMAT(created_at, '%Y-%m') AS label,
            COUNT(*) AS total,
            SUM(event_type = 'LOGIN_SUCCESS') AS login_success,
            SUM(event_type IN ('LOGIN_FAILED', 'LOGIN_BLOCKED')) AS login_failed,
            SUM(event_type = 'QR_GENERATED') AS qr_generated,
            SUM(event_type = 'QR_VERIFIED' AND result = 'SUCCESS') AS qr_verified
          FROM activity_events
          WHERE institucion_id = ?
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
          GROUP BY DATE_FORMAT(created_at, '%Y-%m')
          ORDER BY DATE_FORMAT(created_at, '%Y-%m')
          """, institutionId);

      default -> jdbc.queryForList("""
          SELECT
            DATE_FORMAT(created_at, '%Y-%m-%d') AS label,
            COUNT(*) AS total,
            SUM(event_type = 'LOGIN_SUCCESS') AS login_success,
            SUM(event_type IN ('LOGIN_FAILED', 'LOGIN_BLOCKED')) AS login_failed,
            SUM(event_type = 'QR_GENERATED') AS qr_generated,
            SUM(event_type = 'QR_VERIFIED' AND result = 'SUCCESS') AS qr_verified
          FROM activity_events
          WHERE institucion_id = ?
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          GROUP BY DATE(created_at)
          ORDER BY DATE(created_at)
          """, institutionId);
    };
  }

  private List<Map<String, Object>> loadRecentActivity(Long institutionId) {
    return jdbc.queryForList("""
        SELECT
          id,
          created_at,
          rut,
          display_name,
          event_type,
          result,
          ip_address,
          details
        FROM activity_events
        WHERE institucion_id = ?
        ORDER BY created_at DESC
        LIMIT 100
        """, institutionId);
  }

  private List<Map<String, Object>> loadTopFailedIps(Long institutionId) {
    return jdbc.queryForList("""
        SELECT
          COALESCE(NULLIF(ip_address, ''), 'SIN_IP') AS ip,
          COUNT(*) AS attempts
        FROM activity_events
        WHERE institucion_id = ?
          AND event_type IN ('LOGIN_FAILED', 'LOGIN_BLOCKED')
          AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY COALESCE(NULLIF(ip_address, ''), 'SIN_IP')
        HAVING COUNT(*) >= 3
        ORDER BY attempts DESC
        LIMIT 10
        """, institutionId);
  }

  private long queryCount(String sql, Long institutionId) {
    Long value = jdbc.queryForObject(sql, Long.class, institutionId);
    return value == null ? 0L : value;
  }

  private Long resolveInstitutionId(String institutionCode) {
    String code = institutionCode == null
        ? "HBDT"
        : institutionCode.trim().toUpperCase(Locale.ROOT);

    if (code.isBlank()) {
      code = "HBDT";
    }

    List<Long> ids = jdbc.query("""
        SELECT id
        FROM instituciones
        WHERE UPPER(codigo) = ?
          AND activo = 1
        LIMIT 1
        """,
        (rs, rowNum) -> rs.getLong("id"),
        code
    );

    if (ids.isEmpty()) {
      throw new IllegalArgumentException(
          "Institución no encontrada o inactiva: " + code
      );
    }

    return ids.get(0);
  }

  private String normalizePeriod(String period) {
    String value = period == null
        ? "DAILY"
        : period.trim().toUpperCase(Locale.ROOT);

    if (value.equals("WEEKLY") || value.equals("MONTHLY")) {
      return value;
    }

    return "DAILY";
  }

  private void appendCsvRow(StringBuilder csv, String... values) {
    for (int i = 0; i < values.length; i++) {
      if (i > 0) {
        csv.append(',');
      }
      csv.append(csvEscape(values[i]));
    }
    csv.append("\r\n");
  }

  private String csvEscape(String value) {
    String safe = value == null ? "" : value;
    return "\"" + safe.replace("\"", "\"\"") + "\"";
  }

  private String value(Object value) {
    return value == null ? "" : String.valueOf(value);
  }
}