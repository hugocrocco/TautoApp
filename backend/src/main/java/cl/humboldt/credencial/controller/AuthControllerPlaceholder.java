package cl.humboldt.credencial.controller;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import cl.humboldt.credencial.entity.Member;
import cl.humboldt.credencial.entity.SocioFoto;
import cl.humboldt.credencial.repo.MemberRepository;
import cl.humboldt.credencial.repo.SocioFotoRepository;
import cl.humboldt.credencial.service.UserPhotoStorageService;

import java.util.Locale;
import java.util.Map;

@CrossOrigin(origins = {"http://localhost:5173", "http://192.168.1.7:5173"}, allowCredentials = "false")
@RestController
@RequestMapping("/api/auth")
public class AuthControllerPlaceholder {

  private static final Logger log = LoggerFactory.getLogger(AuthControllerPlaceholder.class);

  private final UserPhotoStorageService storageService;
  private final SocioFotoRepository socioFotoRepository;
  private final MemberRepository memberRepository;
  private final String bucketName;

  public AuthControllerPlaceholder(
      UserPhotoStorageService storageService,
      SocioFotoRepository socioFotoRepository,
      MemberRepository memberRepository,
      @Value("${oci.objectstorage.bucket}") String bucketName
  ) {
    this.storageService = storageService;
    this.socioFotoRepository = socioFotoRepository;
    this.memberRepository = memberRepository;
    this.bucketName = bucketName;
  }

  @GetMapping("/ping")
  public ResponseEntity<?> ping() {
    log.info("AUTH PING OK");
    return ResponseEntity.ok(Map.of("ok", true, "message", "pong"));
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  static class RegisterJsonRequest {
    public Long institucionId;
    public String displayName;
    public String rut;
    public String password;
    public String email;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  static class LoginJsonRequest {
    public String rut;
    public String password;
    public Long institucionId;
  }

  @PostMapping(
      value = "/register",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> registerJson(@RequestBody RegisterJsonRequest req) throws Exception {
    Long institucionId = (req.institucionId == null ? 1L : req.institucionId);
    String displayName = (req.displayName == null ? "" : req.displayName);
    String rut = (req.rut == null ? "" : req.rut);
    String email = normalizeEmail(req.email);

    log.info("REGISTER(JSON): rut={} displayName={} email={} hasPhoto=false", normalizeRut(rut), displayName, email);

    // Validación padrón (BD members)
    if (!existsActiveMemberByRutAndName(rut, displayName)) {
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "No encontramos tu nombre y RUT en el padrón del sindicato."
      ));
    }

    String passwordHash = BCrypt.hashpw(req.password == null ? "" : req.password, BCrypt.gensalt(10));
    String credentialCode = "HUMB-" + String.format("%03d", (int) (Math.random() * 900 + 100));
    String verificationCode = generateVerificationCode();
    log.info("EMAIL VERIFICATION PREPARED(JSON): rut={} email={} code={}", normalizeRut(rut), email, verificationCode);

    return ResponseEntity.ok(Map.ofEntries(
        Map.entry("ok", true),
        Map.entry("displayName", displayName),
        Map.entry("rutMasked", maskRut(rut)),
        Map.entry("credentialCode", credentialCode),
        Map.entry("email", email),
        Map.entry("emailVerificationPrepared", true),
        Map.entry("emailVerificationSent", false),
        Map.entry("photoObjectKey", ""),
        Map.entry("photoReceived", false),
        Map.entry("photoUploaded", false),
        Map.entry("passwordHash", passwordHash)
    ));
  }

  @PostMapping(
      value = "/login",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> login(@RequestBody LoginJsonRequest req) {
    String rut = (req == null || req.rut == null) ? "" : req.rut;
    String password = (req == null || req.password == null) ? "" : req.password;
    Long institucionId = (req == null || req.institucionId == null) ? 1L : req.institucionId;

    String rutNorm = normalizeRut(rut);

    if (rutNorm.isEmpty() || password.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "Completa RUT y contraseña."
      ));
    }

    // 1) Validar que exista en el padrón y esté ACTIVO
    var opt = memberRepository.findByRut(rutNorm);
    if (opt.isEmpty()) {
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "No encontramos tu RUT en el padrón del sindicato."
      ));
    }

    Member m = opt.get();
    String estado = (m.getEstadoSindicato() == null ? "" : m.getEstadoSindicato().trim().toUpperCase(Locale.ROOT));
    if (!"ACTIVO".equals(estado)) {
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "Tu cuenta no está activa en el sindicato."
      ));
    }

    // 2) MVP: todavía no persistimos password por usuario.
    // Para no bloquear el avance del frontend, aceptamos cualquier contraseña no vacía.
    // (En el siguiente paso lo amarramos a una tabla de usuarios y validamos BCrypt.checkpw)

    // 3) Buscar foto si existe
    String photoObjectKey = socioFotoRepository
        .findByInstitucionIdAndRut(institucionId, rutNorm)
        .map(SocioFoto::getObjectKey)
        .orElse("");

    return ResponseEntity.ok(Map.of(
        "ok", true,
        "rut", rutNorm,
        "displayName", (m.getNombreCompleto() == null ? "" : m.getNombreCompleto()),
        "estadoSindicato", estado,
        "photoObjectKey", photoObjectKey
    ));
  }

  @GetMapping(
      value = "/me",
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> me() {
    // MVP: no hay sesión real todavía
    return ResponseEntity.status(401).body(Map.of(
        "ok", false,
        "message", "Sin sesión (MVP)."
    ));
  }

  /**
   * Registro (MVP)
   * POST /api/auth/register
   * form-data:
   *  - institucionId (opcional, default 1)
   *  - displayName
   *  - rut
   *  - password
   *  - email (optional)
   *  - photo (opcional)
   */
  @PostMapping(
      value = "/register",
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> register(
      @RequestParam(required = false, defaultValue = "1") Long institucionId,
      @RequestParam String displayName,
      @RequestParam String rut,
      @RequestParam String password,
      @RequestParam(required = false, defaultValue = "") String email,
      @RequestPart(required = false) MultipartFile photo
  ) throws Exception {

    String emailClean = normalizeEmail(email);

    log.info("REGISTER(MULTIPART) HIT: institucionId={} rut={} displayName={} email={} hasPhotoParam={}",
        institucionId,
        normalizeRut(rut),
        displayName,
        emailClean,
        (photo != null)
    );

    // Validación padrón (BD members)
    if (!existsActiveMemberByRutAndName(rut, displayName)) {
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "No encontramos tu nombre y RUT en el padrón del sindicato."
      ));
    }

    // 2) Hash password (MVP: aún no lo persistimos)
    String passwordHash = BCrypt.hashpw(password, BCrypt.gensalt(10));

    // Debug: confirmar si la foto llega desde el frontend (celular/PC)
    if (photo == null) {
      log.info("REGISTER: rut={} displayName={} photo=NULL", normalizeRut(rut), displayName);
    } else {
      log.info("REGISTER: rut={} displayName={} photoName={} size={} contentType={} empty={}",
          normalizeRut(rut),
          displayName,
          photo.getOriginalFilename(),
          photo.getSize(),
          photo.getContentType(),
          photo.isEmpty()
      );
    }

    // 3) Subir foto a OCI + guardar metadata en BD (socio_foto)
    String photoObjectKey = "";
    boolean photoUploaded = false;

    if (photo != null && !photo.isEmpty()) {
      photoObjectKey = storageService.buildObjectName(institucionId, rut);

      try (var in = photo.getInputStream()) {
        storageService.uploadPhoto(
            photoObjectKey,
            in,
            photo.getSize(),
            photo.getContentType()
        );
        photoUploaded = true;
        log.info("OCI UPLOAD OK: objectKey={} bytes={}", photoObjectKey, photo.getSize());
      } catch (Exception ex) {
        // Importante: dejar trazabilidad clara si falla OCI
        log.error("OCI UPLOAD FAIL: objectKey={} rut={} msg={}",
            photoObjectKey,
            normalizeRut(rut),
            ex.getMessage(),
            ex
        );
        // Para la prueba, devolvemos error explícito
        return ResponseEntity.status(500).body(Map.of(
            "ok", false,
            "message", "Falló la subida de la foto a OCI",
            "photoObjectKey", photoObjectKey
        ));
      }

      // Upsert metadata
      SocioFoto foto = socioFotoRepository
          .findByInstitucionIdAndRut(institucionId, rut)
          .orElseGet(SocioFoto::new);

      foto.setInstitucionId(institucionId);
      foto.setRut(rut);
      foto.setObjectKey(photoObjectKey);
      foto.setBucket(bucketName);
      foto.setEtag(null); // si luego quieres guardar el etag real, hay que capturarlo desde la respuesta OCI
      foto.setSizeBytes(photo.getSize());

      socioFotoRepository.save(foto);
      log.info("DB socio_foto UPSERT OK: institucionId={} rut={} objectKey={}",
          institucionId, normalizeRut(rut), photoObjectKey);
    } else {
      log.info("REGISTER: sin foto (photo null o empty) rut={}", normalizeRut(rut));
    }

    // 4) Generar credencialCode (MVP)
    String credentialCode = "HUMB-" + String.format("%03d", (int) (Math.random() * 900 + 100));
    String verificationCode = generateVerificationCode();
    log.info("EMAIL VERIFICATION PREPARED(MULTIPART): rut={} email={} code={}", normalizeRut(rut), emailClean, verificationCode);

    return ResponseEntity.ok(Map.ofEntries(
        Map.entry("ok", true),
        Map.entry("displayName", displayName),
        Map.entry("rutMasked", maskRut(rut)),
        Map.entry("credentialCode", credentialCode),
        Map.entry("email", emailClean),
        Map.entry("emailVerificationPrepared", true),
        Map.entry("emailVerificationSent", false),
        Map.entry("photoObjectKey", photoObjectKey),
        Map.entry("photoReceived", (photo != null && !photo.isEmpty())),
        Map.entry("photoUploaded", photoUploaded),
        Map.entry("passwordHash", passwordHash)
    ));
  }

  // ----------------------
  // Validación padrón (BD: tabla members)
  // ----------------------

  private boolean existsActiveMemberByRutAndName(String rut, String displayName) {
    String rutNorm = normalizeRut(rut);
    String nameNorm = normalizeName(displayName);

    if (rutNorm.isEmpty() || nameNorm.isEmpty()) return false;

    var opt = memberRepository.findByRut(rutNorm);
    if (opt.isEmpty()) {
      log.info("Members(DB): no existe rut={}", rutNorm);
      return false;
    }

    Member m = opt.get();

    // Validar estado
    String estado = (m.getEstadoSindicato() == null ? "" : m.getEstadoSindicato().trim().toUpperCase(Locale.ROOT));
    if (!"ACTIVO".equals(estado)) {
      log.info("Members(DB): rut={} estadoSindicato={} (no ACTIVO)", rutNorm, estado);
      return false;
    }

    // Validar nombre (estricto por ahora)
    String dbNameNorm = normalizeName(m.getNombreCompleto());
    if (!nameNorm.equals(dbNameNorm)) {
      log.info("Members(DB): no match nombre rut={} input='{}' db='{}'", rutNorm, nameNorm, dbNameNorm);
      return false;
    }

    return true;
  }

  private String normalizeEmail(String email) {
    if (email == null) return "";
    return email.trim().toLowerCase(Locale.ROOT);
  }

  private String generateVerificationCode() {
    return String.format("%06d", (int) (Math.random() * 900000) + 100000);
  }

  private String normalizeRut(String rut) {
    if (rut == null) return "";
    String r = rut.trim().toUpperCase(Locale.ROOT).replace(".", "").replace(" ", "");
    r = r.replaceAll("[^0-9K-]", "");

    if (r.contains("-")) {
      r = r.replaceAll("-+", "-");
      String[] parts = r.split("-");
      if (parts.length >= 2) {
        String num = parts[0].replaceAll("[^0-9]", "");
        String dv = parts[1].replaceAll("[^0-9K]", "");
        if (dv.length() > 1) dv = dv.substring(0, 1);
        if (!num.isEmpty() && !dv.isEmpty()) return num + "-" + dv;
        if (!num.isEmpty()) return num;
      }
    }

    String clean = r.replaceAll("[^0-9K]", "");
    if (clean.length() >= 2) {
      String num = clean.substring(0, clean.length() - 1);
      String dv = clean.substring(clean.length() - 1);
      return num + "-" + dv;
    }

    return clean;
  }

  private String normalizeName(String name) {
    if (name == null) return "";
    String s = name.trim().replaceAll("\\s+", " ");
    return s.toLowerCase(Locale.ROOT);
  }

  private String maskRut(String rut) {
    String clean = rut == null ? "" : rut.replace(".", "").trim();
    if (clean.length() < 4) return "****";
    return clean.substring(0, Math.min(6, clean.length())) + ".***-*";
  }
}