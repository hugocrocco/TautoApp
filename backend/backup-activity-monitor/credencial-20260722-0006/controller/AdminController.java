package cl.humboldt.credencial.controller;

import cl.humboldt.credencial.entity.AppUser;
import cl.humboldt.credencial.entity.Member;
import cl.humboldt.credencial.entity.SocioFoto;
import cl.humboldt.credencial.repo.AppUserRepository;
import cl.humboldt.credencial.repo.MemberRepository;
import cl.humboldt.credencial.repo.SocioFotoRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@CrossOrigin(
    origins = {
        "http://localhost:5173",
        "http://192.168.1.7:5173",
        "https://tauto.cl",
        "https://www.tauto.cl",
        "https://hbdt.tauto.cl"
    },
    allowCredentials = "false"
)
@RestController
@RequestMapping("/api/admin")
public class AdminController {

  private final AppUserRepository appUserRepository;
  private final MemberRepository memberRepository;
  private final SocioFotoRepository socioFotoRepository;
  private final String adminKey;

  public AdminController(
      AppUserRepository appUserRepository,
      MemberRepository memberRepository,
      SocioFotoRepository socioFotoRepository,
      @Value("${app.admin-key}") String adminKey
  ) {
    this.appUserRepository = appUserRepository;
    this.memberRepository = memberRepository;
    this.socioFotoRepository = socioFotoRepository;
    this.adminKey = adminKey;
  }

  @GetMapping("/health")
  public ResponseEntity<?> health() {
    return ResponseEntity.ok(Map.of(
        "ok", true,
        "service", "credencial-api",
        "area", "admin"
    ));
  }

  @GetMapping("/users")
  public ResponseEntity<?> listUsers(
      @RequestHeader(value = "X-ADMIN-KEY", required = false) String key,
      @RequestParam(required = false, defaultValue = "") String q
  ) {
    if (!isValidAdminKey(key)) {
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "No autorizado."
      ));
    }

    String query = normalize(q);

    List<Map<String, Object>> users = appUserRepository.findAll()
        .stream()
        .filter(user -> matchesQuery(user, query))
        .sorted(Comparator.comparing(AppUser::getRut))
        .map(this::toAdminUserRow)
        .toList();

    return ResponseEntity.ok(Map.of(
        "ok", true,
        "count", users.size(),
        "users", users
    ));
  }

  private Map<String, Object> toAdminUserRow(AppUser user) {
    String rut = safe(user.getRut());

    var memberOpt = memberRepository.findByRut(rut);
    var photoOpt = socioFotoRepository.findByInstitucionIdAndRut(1L, rut);

    String estadoSindicato = memberOpt
        .map(Member::getEstadoSindicato)
        .map(this::safe)
        .orElse("");

    String nombrePadron = memberOpt
        .map(Member::getNombreCompleto)
        .map(this::safe)
        .orElse("");

    String telefono = memberOpt
        .map(Member::getTelefono)
        .map(this::safe)
        .orElse("");

    String emailPadron = memberOpt
        .map(Member::getEmail)
        .map(this::safe)
        .orElse("");

    String cuotas = memberOpt
        .map(Member::getAlDiaCuotas)
        .map(v -> Boolean.TRUE.equals(v) ? "AL_DIA" : "PENDIENTE")
        .orElse("SIN_DATO");

    String ultimaCuota = memberOpt
        .map(Member::getUltimaCuotaPagada)
        .map(String::valueOf)
        .orElse("");

    String photoObjectKey = photoOpt
        .map(SocioFoto::getObjectKey)
        .map(this::safe)
        .orElse("");

    String photoUrl = photoObjectKey.isBlank()
        ? ""
        : "/api/photos/1/" + rut;

    return Map.ofEntries(
        Map.entry("rut", rut),
        Map.entry("displayName", safe(user.getDisplayName())),
        Map.entry("email", safe(user.getEmail())),
        Map.entry("emailVerified", user.isEmailVerified()),
        Map.entry("status", safe(user.getStatus())),
        Map.entry("estadoSindicato", estadoSindicato),
        Map.entry("nombrePadron", nombrePadron),
        Map.entry("telefono", telefono),
        Map.entry("emailPadron", emailPadron),
        Map.entry("cuotas", cuotas),
        Map.entry("ultimaCuotaPagada", ultimaCuota),
        Map.entry("photoObjectKey", photoObjectKey),
        Map.entry("photoUrl", photoUrl)
    );
  }

  private boolean matchesQuery(AppUser user, String query) {
    if (query == null || query.isBlank()) return true;

    String rut = normalize(user.getRut());
    String name = normalize(user.getDisplayName());
    String email = normalize(user.getEmail());

    return rut.contains(query) || name.contains(query) || email.contains(query);
  }

  private boolean isValidAdminKey(String key) {
    return key != null && !key.isBlank() && key.equals(adminKey);
  }

  private String safe(String value) {
    return value == null ? "" : value;
  }

  private String normalize(String value) {
    if (value == null) return "";
    return value.trim().toLowerCase(Locale.ROOT);
  }
}