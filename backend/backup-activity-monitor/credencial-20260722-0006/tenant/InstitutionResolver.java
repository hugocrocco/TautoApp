package cl.humboldt.credencial.tenant;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Component
public class InstitutionResolver {

  public static final String INSTITUTION_HEADER = "X-Institution-Code";

  private final JdbcTemplate jdbc;

  public InstitutionResolver(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public Long resolveInstitutionId(HttpServletRequest request) {
    String institutionCode = request.getHeader(INSTITUTION_HEADER);

    if (institutionCode == null || institutionCode.isBlank()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "No fue posible identificar la institución"
      );
    }

    String normalizedCode = institutionCode
        .trim()
        .toUpperCase(Locale.ROOT);

    List<Long> institutionIds = jdbc.query(
        """
        SELECT id
        FROM instituciones
        WHERE codigo = ?
          AND activo = 1
        LIMIT 1
        """,
        (resultSet, rowNumber) -> resultSet.getLong("id"),
        normalizedCode
    );

    if (institutionIds.isEmpty()) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Institución inválida o deshabilitada"
      );
    }

    return institutionIds.get(0);
  }
}