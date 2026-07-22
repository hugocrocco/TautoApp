package cl.humboldt.credencial.controller;

import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessagesController {

  private final JdbcTemplate jdbc;

  public MessagesController(JdbcTemplate jdbc) {
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
  public Map<String, Object> listForMember(@RequestParam String rut) {
    String cleanRut = normalizeRut(rut);

    List<Map<String, Object>> memberRows = jdbc.queryForList(
        "SELECT estado_sindicato FROM members WHERE rut = ? LIMIT 1",
        cleanRut
    );

    String status = memberRows.isEmpty() ? "" : stringValue(memberRows.get(0).get("estado_sindicato")).toUpperCase();

    List<Map<String, Object>> rows = jdbc.queryForList("""
        SELECT id, title, body, message_type, recipient_rut, target_status, created_at
        FROM messages
        WHERE (message_type = 'PERSONAL' AND recipient_rut = ?)
           OR (message_type = 'GENERAL' AND (target_status = 'TODOS' OR target_status = ?))
        ORDER BY created_at DESC
        LIMIT 100
        """, cleanRut, status);

    List<Map<String, Object>> messages = rows.stream().map(this::toDto).toList();
    return Map.of("ok", true, "messages", messages, "count", messages.size());
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

  private String stringValue(Object value) { return value == null ? "" : String.valueOf(value); }
}
