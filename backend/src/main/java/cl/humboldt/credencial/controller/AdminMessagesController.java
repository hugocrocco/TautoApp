package cl.humboldt.credencial.controller;

import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/messages")
public class AdminMessagesController {

  private final JdbcTemplate jdbc;

  public AdminMessagesController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @PostConstruct
  public void ensureTables() {
    jdbc.execute("""
        CREATE TABLE IF NOT EXISTS messages (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(160) NOT NULL,
          body TEXT NOT NULL,
          message_type VARCHAR(20) NOT NULL,
          recipient_rut VARCHAR(20),
          target_status VARCHAR(20),
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """);
  }

  @GetMapping
  public Map<String, Object> list() {
    List<Map<String, Object>> rows = jdbc.queryForList("""
        SELECT id, title, body, message_type, recipient_rut, target_status, created_at
        FROM messages
        ORDER BY created_at DESC
        LIMIT 200
        """);

    List<Map<String, Object>> messages = rows.stream().map(this::toDto).toList();
    return Map.of("ok", true, "messages", messages, "count", messages.size());
  }

  @PostMapping
  public Map<String, Object> create(@RequestBody Map<String, Object> body) {
    String type = clean(stringValue(body.get("messageType"))).toUpperCase();
    String title = clean(stringValue(body.get("title")));
    String text = cleanLong(stringValue(body.get("body")));
    String recipientRut = normalizeRut(stringValue(body.get("recipientRut")));
    String targetStatus = clean(stringValue(body.get("targetStatus"))).toUpperCase();

    if (title.isBlank()) return Map.of("ok", false, "message", "El título es obligatorio.");
    if (text.isBlank()) return Map.of("ok", false, "message", "El mensaje es obligatorio.");

    if (!type.equals("PERSONAL")) type = "GENERAL";

    if (type.equals("PERSONAL")) {
      if (recipientRut.isBlank()) return Map.of("ok", false, "message", "Para mensaje personal debes ingresar el RUT.");
      targetStatus = null;
    } else {
      recipientRut = null;
      if (!targetStatus.equals("ACTIVO") && !targetStatus.equals("NO_ACTIVO")) {
        targetStatus = "TODOS";
      }
    }

    jdbc.update("""
        INSERT INTO messages (title, body, message_type, recipient_rut, target_status)
        VALUES (?, ?, ?, ?, ?)
        """, title, text, type, recipientRut, targetStatus);

    return Map.of("ok", true, "message", "Mensaje enviado correctamente.");
  }

  @DeleteMapping("/{id}")
  public Map<String, Object> delete(@PathVariable Long id) {
    jdbc.update("DELETE FROM messages WHERE id = ?", id);
    return Map.of("ok", true, "message", "Mensaje eliminado.");
  }

  private Map<String, Object> toDto(Map<String, Object> row) {
    Map<String, Object> dto = new LinkedHashMap<>();
    dto.put("id", row.get("id"));
    dto.put("title", stringValue(row.get("title")));
    dto.put("body", stringValue(row.get("body")));
    dto.put("messageType", stringValue(row.get("message_type")));
    dto.put("recipientRut", stringValue(row.get("recipient_rut")));
    dto.put("targetStatus", stringValue(row.get("target_status")));
    dto.put("createdAt", stringValue(row.get("created_at")));
    return dto;
  }

  private String normalizeRut(String value) {
    if (value == null) return "";
    return value.trim().toUpperCase().replace(".", "").replace(" ", "");
  }

  private String clean(String value) { return value == null ? "" : value.trim().replaceAll("\\s+", " "); }
  private String cleanLong(String value) { return value == null ? "" : value.trim(); }
  private String stringValue(Object value) { return value == null ? "" : String.valueOf(value); }
}
