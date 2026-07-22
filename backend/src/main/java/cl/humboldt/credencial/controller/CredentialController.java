package cl.humboldt.credencial.controller;

import cl.humboldt.credencial.entity.Member;
import cl.humboldt.credencial.repo.MemberRepository;
import cl.humboldt.credencial.service.CredentialTokenService;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;
import cl.humboldt.credencial.tenant.InstitutionResolver;

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
@RequestMapping("/api/credential")
public class CredentialController {

  private final CredentialTokenService tokenService;
  private final MemberRepository memberRepository;
  private final InstitutionResolver institutionResolver;

  public CredentialController(CredentialTokenService tokenService, MemberRepository memberRepository, InstitutionResolver institutionResolver) {
    this.tokenService = tokenService;
    this.memberRepository = memberRepository;
    this.institutionResolver = institutionResolver;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  static class GenerateQrRequest {
    public String rut;
  }

  @PostMapping("/qr")
  public ResponseEntity<?> generateQr(@RequestBody GenerateQrRequest req, HttpServletRequest request) {
    Long institucionId = institutionResolver.resolveInstitutionId(request);
    String rut = normalizeRut(req == null ? "" : req.rut);

    if (rut.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "RUT requerido para generar QR."
      ));
    }

    var memberOpt = memberRepository.findByInstitucionIdAndRut(institucionId, rut);
    if (memberOpt.isEmpty()) {
      return ResponseEntity.status(404).body(Map.of(
          "ok", false,
          "message", "Socio no encontrado."
      ));
    }

    Member member = memberOpt.get();
    if (!isActive(member)) {
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "Socio no vigente."
      ));
    }

    var generated = tokenService.generate(institucionId, rut);

    return ResponseEntity.ok(Map.of(
        "ok", true,
        "token", generated.token(),
        "expiresAt", generated.expiresAtMillis(),
        "expiresAtText", formatInstant(generated.expiresAtMillis()),
        "ttlSeconds", generated.ttlSeconds(),
        "remainingSeconds", generated.ttlSeconds()
    ));
  }

  @GetMapping("/verify/{token}")
  public ResponseEntity<?> verify(@PathVariable String token, HttpServletRequest request) {
    Long institucionId = institutionResolver.resolveInstitutionId(request);
    var verified = tokenService.verify(token);

    if (verified.valid() && !institucionId.equals(verified.institucionId())) {
      return ResponseEntity.status(403).body(Map.of("ok", false, "status", "INVALID_INSTITUTION", "message", "La credencial pertenece a otra institución."));
    }

    if (!verified.valid()) {
      return ResponseEntity.ok(Map.of(
          "ok", false,
          "status", verified.expired() ? "EXPIRED" : "INVALID",
          "message", verified.message(),
          "rut", verified.rut(),
          "expiresAt", verified.expiresAtMillis(),
          "remainingSeconds", 0
      ));
    }

    var memberOpt = memberRepository.findByInstitucionIdAndRut(institucionId, verified.rut());
    if (memberOpt.isEmpty()) {
      return ResponseEntity.ok(Map.of(
          "ok", false,
          "status", "NOT_FOUND",
          "message", "Socio no encontrado.",
          "remainingSeconds", verified.remainingSeconds()
      ));
    }

    Member member = memberOpt.get();
    if (!isActive(member)) {
      return ResponseEntity.ok(Map.of(
          "ok", false,
          "status", "REVOKED",
          "message", "El socio no se encuentra vigente.",
          "rut", member.getRut(),
          "displayName", member.getNombreCompleto(),
          "remainingSeconds", verified.remainingSeconds(),
          "expiresAt", verified.expiresAtMillis(),
          "expiresAtText", formatInstant(verified.expiresAtMillis())
      ));
    }

    return ResponseEntity.ok(Map.ofEntries(
    Map.entry("ok", true),
    Map.entry("status", "VALID"),
    Map.entry("message", "Credencial verificada correctamente."),
    Map.entry("rut", member.getRut()),
    Map.entry("rutMasked", maskRut(member.getRut())),
    Map.entry("displayName", member.getNombreCompleto()),
    Map.entry("estadoSindicato", member.getEstadoSindicato()),
    Map.entry("alDiaCuotas", Boolean.TRUE.equals(member.getAlDiaCuotas())),
    Map.entry("remainingSeconds", verified.remainingSeconds()),
    Map.entry("expiresAt", verified.expiresAtMillis()),
    Map.entry("expiresAtText", formatInstant(verified.expiresAtMillis()))
));
  }

  private boolean isActive(Member member) {
    String estado = member.getEstadoSindicato() == null ? "" : member.getEstadoSindicato().trim().toUpperCase(Locale.ROOT);
    return "ACTIVO".equals(estado);
  }

  private String normalizeRut(String rut) {
    if (rut == null) return "";
    String r = rut.trim().toUpperCase(Locale.ROOT)
        .replace(".", "")
        .replace("-", "")
        .replace(" ", "");

    if (r.length() < 2) return r;
    return r.substring(0, r.length() - 1) + "-" + r.substring(r.length() - 1);
  }

  private String maskRut(String rut) {
    String clean = rut == null ? "" : rut.replace(".", "").trim();
    if (clean.length() < 4) return "****";
    return clean.substring(0, Math.min(6, clean.length())) + ".***-*";
  }

  private String formatInstant(long millis) {
    if (millis <= 0) return "";
    return DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss")
        .withZone(ZoneId.of("America/Santiago"))
        .format(Instant.ofEpochMilli(millis));
  }
}
