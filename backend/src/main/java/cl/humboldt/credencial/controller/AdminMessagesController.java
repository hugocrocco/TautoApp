package cl.humboldt.credencial.controller;

import cl.humboldt.credencial.tenant.InstitutionResolver;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/messages")
public class AdminMessagesController {

    private final JdbcTemplate jdbc;
    private final InstitutionResolver resolver;

    public AdminMessagesController(
            JdbcTemplate jdbc,
            InstitutionResolver resolver
    ) {
        this.jdbc = jdbc;
        this.resolver = resolver;
    }

    @PostConstruct
    public void ensureTables() {
        jdbc.execute(
                "CREATE TABLE IF NOT EXISTS messages (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                        "institucion_id BIGINT NOT NULL," +
                        "title VARCHAR(160) NOT NULL," +
                        "body TEXT NOT NULL," +
                        "message_type VARCHAR(20) NOT NULL," +
                        "recipient_rut VARCHAR(20)," +
                        "target_status VARCHAR(20)," +
                        "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
                        "INDEX idx_messages_inst (institucion_id)" +
                        ")"
        );
    }

    @GetMapping
    public Map<String, Object> list(HttpServletRequest request) {
        Long institutionId = resolver.resolveInstitutionId(request);

        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, title, body, message_type, recipient_rut, " +
                        "target_status, created_at " +
                        "FROM messages " +
                        "WHERE institucion_id = ? " +
                        "ORDER BY created_at DESC " +
                        "LIMIT 200",
                institutionId
        );

        List<Map<String, Object>> messages = rows.stream()
                .map(this::dto)
                .toList();

        return Map.of(
                "ok", true,
                "messages", messages,
                "count", messages.size()
        );
    }

    @PostMapping
    public Map<String, Object> create(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request
    ) {
        Long institutionId = resolver.resolveInstitutionId(request);

        String messageType = clean(stringValue(body.get("messageType")))
                .toUpperCase();

        String title = clean(stringValue(body.get("title")));
        String text = stringValue(body.get("body")).trim();

        String recipientRut = normalizeRut(
                stringValue(body.get("recipientRut"))
        );

        String targetStatus = clean(
                stringValue(body.get("targetStatus"))
        ).toUpperCase();

        if (title.isBlank() || text.isBlank()) {
            return Map.of(
                    "ok", false,
                    "message", "Título y mensaje son obligatorios."
            );
        }

        if (!messageType.equals("PERSONAL")) {
            messageType = "GENERAL";
        }

        if (messageType.equals("PERSONAL")) {
            if (recipientRut.isBlank()) {
                return Map.of(
                        "ok", false,
                        "message", "Debes ingresar el RUT."
                );
            }

            targetStatus = null;
        } else {
            recipientRut = null;

            if (!targetStatus.equals("ACTIVO")
                    && !targetStatus.equals("NO_ACTIVO")) {
                targetStatus = "TODOS";
            }
        }

        jdbc.update(
                "INSERT INTO messages (" +
                        "institucion_id, title, body, message_type, " +
                        "recipient_rut, target_status" +
                        ") VALUES (?, ?, ?, ?, ?, ?)",
                institutionId,
                title,
                text,
                messageType,
                recipientRut,
                targetStatus
        );

        return Map.of(
                "ok", true,
                "message", "Mensaje enviado correctamente."
        );
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        Long institutionId = resolver.resolveInstitutionId(request);

        int deleted = jdbc.update(
                "DELETE FROM messages " +
                        "WHERE id = ? AND institucion_id = ?",
                id,
                institutionId
        );

        return Map.of(
                "ok", deleted > 0,
                "message", deleted > 0
                        ? "Mensaje eliminado."
                        : "Mensaje no encontrado."
        );
    }

    private Map<String, Object> dto(Map<String, Object> row) {
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
        if (value == null) {
            return "";
        }

        return value.trim()
                .toUpperCase()
                .replace(".", "")
                .replace(" ", "");
    }

    private String clean(String value) {
        if (value == null) {
            return "";
        }

        return value.trim().replaceAll("\\s+", " ");
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
