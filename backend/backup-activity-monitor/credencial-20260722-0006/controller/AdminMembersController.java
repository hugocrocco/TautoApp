package cl.humboldt.credencial.controller;

import cl.humboldt.credencial.tenant.InstitutionResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/members")
public class AdminMembersController {

  private final JdbcTemplate jdbc;
  private final InstitutionResolver institutionResolver;

  public AdminMembersController(
      JdbcTemplate jdbc,
      InstitutionResolver institutionResolver
  ) {
    this.jdbc = jdbc;
    this.institutionResolver = institutionResolver;
  }

  @GetMapping("/health")
  public Map<String, Object> health(HttpServletRequest request) {
    Long institutionId =
        institutionResolver.resolveInstitutionId(request);

    return Map.of(
        "ok", true,
        "service", "admin-members",
        "institucionId", institutionId
    );
  }

  @GetMapping
  public Map<String, Object> listMembers(
      @RequestParam(required = false) String q,
      HttpServletRequest request
  ) {
    Long institutionId =
        institutionResolver.resolveInstitutionId(request);

    String search = q == null ? "" : q.trim();

    List<Map<String, Object>> rows;

    if (search.isBlank()) {
      rows = jdbc.queryForList("""
          SELECT
            m.rut,
            m.nombre_completo,
            m.email,
            m.telefono,
            m.estado_sindicato,
            m.al_dia_cuotas,
            m.ultima_cuota_pagada,
            u.id AS usuario_id,
            u.email_verified,
            u.status AS estado_usuario
          FROM members m
          LEFT JOIN app_users u
            ON u.institucion_id = m.institucion_id
           AND REPLACE(REPLACE(UPPER(u.rut), '.', ''), ' ', '') =
               REPLACE(REPLACE(UPPER(m.rut), '.', ''), ' ', '')
          WHERE m.institucion_id = ?
          ORDER BY m.nombre_completo ASC
          """,
          institutionId
      );
    } else {
      String like = "%" + search + "%";

      rows = jdbc.queryForList("""
          SELECT
            m.rut,
            m.nombre_completo,
            m.email,
            m.telefono,
            m.estado_sindicato,
            m.al_dia_cuotas,
            m.ultima_cuota_pagada,
            u.id AS usuario_id,
            u.email_verified,
            u.status AS estado_usuario
          FROM members m
          LEFT JOIN app_users u
            ON u.institucion_id = m.institucion_id
           AND REPLACE(REPLACE(UPPER(u.rut), '.', ''), ' ', '') =
               REPLACE(REPLACE(UPPER(m.rut), '.', ''), ' ', '')
          WHERE m.institucion_id = ?
            AND (
                 m.rut LIKE ?
              OR m.nombre_completo LIKE ?
              OR m.email LIKE ?
              OR m.telefono LIKE ?
            )
          ORDER BY m.nombre_completo ASC
          """,
          institutionId,
          like,
          like,
          like,
          like
      );
    }

    List<Map<String, Object>> members = rows.stream()
        .map(this::toMemberDto)
        .toList();

    return Map.of(
        "ok", true,
        "members", members,
        "count", members.size()
    );
  }

  @GetMapping("/{rut}")
  public Map<String, Object> getMember(
      @PathVariable String rut,
      HttpServletRequest request
  ) {
    Long institutionId =
        institutionResolver.resolveInstitutionId(request);

    String cleanRut = normalizeRut(rut);

    List<Map<String, Object>> rows = jdbc.queryForList("""
        SELECT
          m.rut,
          m.nombre_completo,
          m.email,
          m.telefono,
          m.estado_sindicato,
          m.al_dia_cuotas,
          m.ultima_cuota_pagada,
          u.id AS usuario_id,
          u.email_verified,
          u.status AS estado_usuario
        FROM members m
        LEFT JOIN app_users u
          ON u.institucion_id = m.institucion_id
         AND REPLACE(REPLACE(UPPER(u.rut), '.', ''), ' ', '') =
             REPLACE(REPLACE(UPPER(m.rut), '.', ''), ' ', '')
        WHERE m.institucion_id = ?
          AND m.rut = ?
        LIMIT 1
        """,
        institutionId,
        cleanRut
    );

    if (rows.isEmpty()) {
      return Map.of(
          "ok", false,
          "message", "Socio no encontrado",
          "rut", cleanRut
      );
    }

    Map<String, Object> dto = toMemberDto(rows.get(0));
    dto.put("ok", true);

    return dto;
  }

  @PostMapping
  public Map<String, Object> saveMember(
      @RequestBody Map<String, Object> body,
      HttpServletRequest request
  ) {
    Long institutionId =
        institutionResolver.resolveInstitutionId(request);

    String rut = normalizeRut(stringValue(body.get("rut")));
    String nombreCompleto =
        cleanText(stringValue(body.get("nombreCompleto")));
    String email =
        cleanNullable(stringValue(body.get("email")));
    String telefono =
        cleanNullable(stringValue(body.get("telefono")));
    String estadoSindicato =
        cleanText(stringValue(body.get("estadoSindicato")))
            .toUpperCase();
    Boolean alDiaCuotas =
        boolValue(body.get("alDiaCuotas"));
    String ultimaCuotaPagada =
        cleanNullable(stringValue(body.get("ultimaCuotaPagada")));

    if (rut.isBlank()) {
      return Map.of(
          "ok", false,
          "message", "RUT es obligatorio"
      );
    }

    if (nombreCompleto.isBlank()) {
      return Map.of(
          "ok", false,
          "message", "Nombre completo es obligatorio"
      );
    }

    if (estadoSindicato.isBlank()) {
      estadoSindicato = "ACTIVO";
    }

    Integer exists = jdbc.queryForObject("""
        SELECT COUNT(*)
        FROM members
        WHERE institucion_id = ?
          AND rut = ?
        """,
        Integer.class,
        institutionId,
        rut
    );

    boolean memberExists =
        exists != null && exists > 0;

    if (memberExists) {
      jdbc.update("""
          UPDATE members
          SET
            nombre_completo = ?,
            email = ?,
            telefono = ?,
            estado_sindicato = ?,
            al_dia_cuotas = ?,
            ultima_cuota_pagada = ?
          WHERE institucion_id = ?
            AND rut = ?
          """,
          nombreCompleto,
          email,
          telefono,
          estadoSindicato,
          alDiaCuotas,
          ultimaCuotaPagada,
          institutionId,
          rut
      );
    } else {
      jdbc.update("""
          INSERT INTO members
            (
              institucion_id,
              rut,
              nombre_completo,
              email,
              telefono,
              estado_sindicato,
              al_dia_cuotas,
              ultima_cuota_pagada
            )
          VALUES
            (?, ?, ?, ?, ?, ?, ?, ?)
          """,
          institutionId,
          rut,
          nombreCompleto,
          email,
          telefono,
          estadoSindicato,
          alDiaCuotas,
          ultimaCuotaPagada
      );
    }

    Map<String, Object> saved =
        getMember(rut, request);

    saved.put(
        "message",
        memberExists
            ? "Socio actualizado"
            : "Socio creado"
    );

    return saved;
  }

  private Map<String, Object> toMemberDto(
      Map<String, Object> row
  ) {
    Map<String, Object> dto =
        new LinkedHashMap<>();

    Boolean alDia =
        boolValue(row.get("al_dia_cuotas"));

    dto.put(
        "rut",
        stringValue(row.get("rut"))
    );

    dto.put(
        "nombreCompleto",
        stringValue(row.get("nombre_completo"))
    );

    dto.put(
        "email",
        stringValue(row.get("email"))
    );

    dto.put(
        "telefono",
        stringValue(row.get("telefono"))
    );

    dto.put(
        "estadoSindicato",
        stringValue(row.get("estado_sindicato"))
    );

    dto.put(
        "alDiaCuotas",
        alDia
    );

    dto.put(
        "cuotas",
        alDia ? "AL_DIA" : "PENDIENTE"
    );

    dto.put(
        "ultimaCuotaPagada",
        stringValue(row.get("ultima_cuota_pagada"))
    );

    boolean usuarioRegistrado =
        row.get("usuario_id") != null;

    dto.put(
        "usuarioRegistrado",
        usuarioRegistrado
    );

    dto.put(
        "emailVerificado",
        usuarioRegistrado
            && boolValue(row.get("email_verified"))
    );

    dto.put(
        "estadoUsuario",
        usuarioRegistrado
            ? stringValue(row.get("estado_usuario"))
            : ""
    );

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

  private String cleanText(String value) {
    if (value == null) {
      return "";
    }

    return value.trim()
        .replaceAll("\\s+", " ");
  }

  private String cleanNullable(String value) {
    String clean = cleanText(value);

    return clean.isBlank()
        ? null
        : clean;
  }

  private String stringValue(Object value) {
    return value == null
        ? ""
        : String.valueOf(value);
  }

  private Boolean boolValue(Object value) {
    if (value == null) {
      return false;
    }

    if (value instanceof Boolean booleanValue) {
      return booleanValue;
    }

    if (value instanceof Number numberValue) {
      return numberValue.intValue() == 1;
    }

    String text = String.valueOf(value)
        .trim()
        .toLowerCase();

    return text.equals("true")
        || text.equals("1")
        || text.equals("yes")
        || text.equals("si")
        || text.equals("sí")
        || text.equals("al_dia");
  }
}