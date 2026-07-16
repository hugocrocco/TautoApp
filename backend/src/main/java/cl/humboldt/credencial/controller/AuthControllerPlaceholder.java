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

import cl.humboldt.credencial.entity.AppUser;
import cl.humboldt.credencial.entity.EmailVerification;
import cl.humboldt.credencial.entity.Member;
import cl.humboldt.credencial.entity.SocioFoto;
import cl.humboldt.credencial.repo.AppUserRepository;
import cl.humboldt.credencial.repo.EmailVerificationRepository;
import cl.humboldt.credencial.repo.MemberRepository;
import cl.humboldt.credencial.repo.SocioFotoRepository;
import cl.humboldt.credencial.service.EmailService;
import cl.humboldt.credencial.service.UserPhotoStorageService;

import java.time.LocalDateTime;
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
@RequestMapping("/api/auth")
public class AuthControllerPlaceholder {

  private static final Logger log = LoggerFactory.getLogger(AuthControllerPlaceholder.class);

  private final UserPhotoStorageService storageService;
  private final SocioFotoRepository socioFotoRepository;
  private final MemberRepository memberRepository;
  private final AppUserRepository appUserRepository;
  private final EmailVerificationRepository emailVerificationRepository;
  private final EmailService emailService;
  private final String bucketName;

  public AuthControllerPlaceholder(
      UserPhotoStorageService storageService,
      SocioFotoRepository socioFotoRepository,
      MemberRepository memberRepository,
      AppUserRepository appUserRepository,
      EmailVerificationRepository emailVerificationRepository,
      EmailService emailService,
      @Value("${oci.objectstorage.bucket}") String bucketName
  ) {
    this.storageService = storageService;
    this.socioFotoRepository = socioFotoRepository;
    this.memberRepository = memberRepository;
    this.appUserRepository = appUserRepository;
    this.emailVerificationRepository = emailVerificationRepository;
    this.emailService = emailService;
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

  @JsonIgnoreProperties(ignoreUnknown = true)
  static class VerifyEmailRequest {
    public String rut;
    public String code;
  }

  @PostMapping(
      value = "/register",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> registerJson(@RequestBody RegisterJsonRequest req) throws Exception {
    Long institucionId = (req == null || req.institucionId == null) ? 1L : req.institucionId;
    String displayName = (req == null || req.displayName == null) ? "" : req.displayName;
    String rut = (req == null || req.rut == null) ? "" : req.rut;
    String password = (req == null || req.password == null) ? "" : req.password;
    String emailClean = normalizeEmail(req == null ? "" : req.email);
    String rutNorm = normalizeRut(rut);

    log.info("REGISTER(JSON): rut={} displayName={} email={} hasPhoto=false", rutNorm, displayName, emailClean);

    if (rutNorm.isEmpty() || displayName.isBlank() || password.isBlank() || emailClean.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "Debes completar nombre, RUT, email y contraseña."
      ));
    }

    if (password.length() < 6) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "La clave debe tener al menos 6 caracteres."
      ));
    }

    if (!existsActiveMemberByRutAndName(rutNorm, displayName)) {
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "No encontramos tu nombre y RUT en el padrón del sindicato."
      ));
    }

    String passwordHash = BCrypt.hashpw(password, BCrypt.gensalt(10));
    String credentialCode = "HUMB-" + String.format("%03d", (int) (Math.random() * 900 + 100));
    String verificationCode = generateVerificationCode();

    boolean emailSent = savePendingUserAndVerificationCode(
        rutNorm,
        displayName,
        emailClean,
        passwordHash,
        verificationCode
    );

    log.info("EMAIL VERIFICATION PREPARED(JSON): rut={} email={} code={} sent={}",
        rutNorm, emailClean, verificationCode, emailSent);

    return ResponseEntity.ok(Map.ofEntries(
        Map.entry("ok", true),
        Map.entry("displayName", displayName),
        Map.entry("rut", rutNorm),
        Map.entry("rutMasked", maskRut(rutNorm)),
        Map.entry("credentialCode", credentialCode),
        Map.entry("email", emailClean),
        Map.entry("emailVerificationPrepared", true),
        Map.entry("emailVerificationSent", emailSent),
        Map.entry("emailVerificationRequired", true),
        Map.entry("message", emailSent
            ? "Registro recibido. Enviamos un código a tu correo para activar la cuenta."
            : "Registro recibido. No se pudo enviar el correo, pero el código quedó generado para revisión."),
        Map.entry("photoObjectKey", ""),
        Map.entry("photoReceived", false),
        Map.entry("photoUploaded", false)
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

    var memberOpt = memberRepository.findByRut(rutNorm);
    if (memberOpt.isEmpty()) {
      log.info("LOGIN FAIL: rut={} motivo=no existe en padrón", rutNorm);
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "No encontramos tu RUT en el padrón del sindicato."
      ));
    }

    Member member = memberOpt.get();
    String estado = (member.getEstadoSindicato() == null ? "" : member.getEstadoSindicato().trim().toUpperCase(Locale.ROOT));

    if (!"ACTIVO".equals(estado)) {
      log.info("LOGIN FAIL: rut={} motivo=socio no activo estado={}", rutNorm, estado);
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "Tu cuenta no está activa en el sindicato."
      ));
    }

    var userOpt = appUserRepository.findByRut(rutNorm);
    if (userOpt.isEmpty()) {
      log.info("LOGIN FAIL: rut={} motivo=no registrado en app_users", rutNorm);
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "Debes registrarte antes de iniciar sesión."
      ));
    }

    AppUser user = userOpt.get();

    if (!BCrypt.checkpw(password, user.getPasswordHash())) {
      log.info("LOGIN FAIL: rut={} motivo=password incorrecta", rutNorm);
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "RUT o contraseña incorrectos."
      ));
    }

    if (!user.isEmailVerified()) {
      log.info("LOGIN FAIL: rut={} motivo=email no verificado", rutNorm);
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "Debes verificar tu correo antes de iniciar sesión.",
          "emailVerificationRequired", true,
          "rut", rutNorm,
          "email", user.getEmail()
      ));
    }

    String photoObjectKey = socioFotoRepository
        .findByInstitucionIdAndRut(institucionId, rutNorm)
        .map(SocioFoto::getObjectKey)
        .orElse("");

    log.info("LOGIN OK: rut={} email={}", rutNorm, user.getEmail());

    return ResponseEntity.ok(Map.of(
        "ok", true,
        "rut", rutNorm,
        "displayName", user.getDisplayName(),
        "email", user.getEmail(),
        "estadoSindicato", estado,
        "photoObjectKey", photoObjectKey
    ));
  }

  @PostMapping(
      value = "/verify-email",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> verifyEmail(@RequestBody VerifyEmailRequest req) {
    String rutNorm = normalizeRut(req == null ? "" : req.rut);
    String code = (req == null || req.code == null) ? "" : req.code.trim();

    if (rutNorm.isEmpty() || code.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "Debes ingresar RUT y código."
      ));
    }

    var userOpt = appUserRepository.findByRut(rutNorm);
    if (userOpt.isEmpty()) {
      return ResponseEntity.status(404).body(Map.of(
          "ok", false,
          "message", "No existe un usuario registrado con ese RUT."
      ));
    }

    var verificationOpt = emailVerificationRepository
        .findTopByRutAndCodeAndUsedFalseOrderByCreatedAtDesc(rutNorm, code);

    if (verificationOpt.isEmpty()) {
      log.info("EMAIL VERIFY FAIL: rut={} motivo=codigo invalido", rutNorm);
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "Código inválido."
      ));
    }

    EmailVerification verification = verificationOpt.get();

    if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
      log.info("EMAIL VERIFY FAIL: rut={} motivo=codigo expirado", rutNorm);
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "El código expiró. Debes registrarte nuevamente para generar otro código."
      ));
    }

    AppUser user = userOpt.get();

    user.setEmailVerified(true);
    user.setStatus("ACTIVE");
    user.setVerifiedAt(LocalDateTime.now());
    appUserRepository.save(user);

    verification.setUsed(true);
    verification.setUsedAt(LocalDateTime.now());
    emailVerificationRepository.save(verification);

    log.info("EMAIL VERIFIED OK: rut={} email={}", rutNorm, user.getEmail());

    return ResponseEntity.ok(Map.of(
        "ok", true,
        "message", "Correo verificado correctamente. Ahora puedes iniciar sesión.",
        "rut", rutNorm,
        "email", user.getEmail()
    ));
  }

  @GetMapping(
      value = "/me",
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> me() {
    return ResponseEntity.status(401).body(Map.of(
        "ok", false,
        "message", "Sin sesión (MVP)."
    ));
  }

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
    String rutNorm = normalizeRut(rut);

    log.info("REGISTER(MULTIPART) HIT: institucionId={} rut={} displayName={} email={} hasPhotoParam={}",
        institucionId,
        rutNorm,
        displayName,
        emailClean,
        (photo != null)
    );

    if (rutNorm.isEmpty() || displayName.isBlank() || password.isBlank() || emailClean.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "Debes completar nombre, RUT, email y contraseña."
      ));
    }

    if (password.length() < 6) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "La clave debe tener al menos 6 caracteres."
      ));
    }

    if (!existsActiveMemberByRutAndName(rutNorm, displayName)) {
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "No encontramos tu nombre y RUT en el padrón del sindicato."
      ));
    }

    String passwordHash = BCrypt.hashpw(password, BCrypt.gensalt(10));

    if (photo == null) {
      log.info("REGISTER: rut={} displayName={} photo=NULL", rutNorm, displayName);
    } else {
      log.info("REGISTER: rut={} displayName={} photoName={} size={} contentType={} empty={}",
          rutNorm,
          displayName,
          photo.getOriginalFilename(),
          photo.getSize(),
          photo.getContentType(),
          photo.isEmpty()
      );
    }

    String photoObjectKey = "";
    boolean photoUploaded = false;

    if (photo != null && !photo.isEmpty()) {
      photoObjectKey = storageService.buildObjectName(institucionId, rutNorm);

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
        log.error("OCI UPLOAD FAIL: objectKey={} rut={} msg={}",
            photoObjectKey,
            rutNorm,
            ex.getMessage(),
            ex
        );

        return ResponseEntity.status(500).body(Map.of(
            "ok", false,
            "message", "Falló la subida de la foto a OCI",
            "photoObjectKey", photoObjectKey
        ));
      }

      SocioFoto foto = socioFotoRepository
          .findByInstitucionIdAndRut(institucionId, rutNorm)
          .orElseGet(SocioFoto::new);

      foto.setInstitucionId(institucionId);
      foto.setRut(rutNorm);
      foto.setObjectKey(photoObjectKey);
      foto.setBucket(bucketName);
      foto.setEtag(null);
      foto.setSizeBytes(photo.getSize());

      socioFotoRepository.save(foto);
      log.info("DB socio_foto UPSERT OK: institucionId={} rut={} objectKey={}",
          institucionId, rutNorm, photoObjectKey);
    } else {
      log.info("REGISTER: sin foto (photo null o empty) rut={}", rutNorm);
    }

    String credentialCode = "HUMB-" + String.format("%03d", (int) (Math.random() * 900 + 100));
    String verificationCode = generateVerificationCode();

    boolean emailSent = savePendingUserAndVerificationCode(
        rutNorm,
        displayName,
        emailClean,
        passwordHash,
        verificationCode
    );

    log.info("EMAIL VERIFICATION PREPARED(MULTIPART): rut={} email={} code={} sent={}",
        rutNorm, emailClean, verificationCode, emailSent);

    return ResponseEntity.ok(Map.ofEntries(
        Map.entry("ok", true),
        Map.entry("displayName", displayName),
        Map.entry("rut", rutNorm),
        Map.entry("rutMasked", maskRut(rutNorm)),
        Map.entry("credentialCode", credentialCode),
        Map.entry("email", emailClean),
        Map.entry("emailVerificationPrepared", true),
        Map.entry("emailVerificationSent", emailSent),
        Map.entry("emailVerificationRequired", true),
        Map.entry("message", emailSent
            ? "Registro recibido. Enviamos un código a tu correo para activar la cuenta."
            : "Registro recibido. No se pudo enviar el correo, pero el código quedó generado para revisión."),
        Map.entry("photoObjectKey", photoObjectKey),
        Map.entry("photoReceived", (photo != null && !photo.isEmpty())),
        Map.entry("photoUploaded", photoUploaded)
    ));
  }

  private boolean savePendingUserAndVerificationCode(
      String rutNorm,
      String displayName,
      String emailClean,
      String passwordHash,
      String verificationCode
  ) {
    AppUser user = appUserRepository.findByRut(rutNorm).orElseGet(AppUser::new);

    user.setRut(rutNorm);
    user.setDisplayName(displayName.trim().replaceAll("\\s+", " "));
    user.setEmail(emailClean);
    user.setPasswordHash(passwordHash);
    user.setEmailVerified(false);
    user.setStatus("PENDING_EMAIL_VERIFICATION");

    appUserRepository.save(user);

    EmailVerification verification = new EmailVerification();
    verification.setRut(rutNorm);
    verification.setEmail(emailClean);
    verification.setCode(verificationCode);
    verification.setUsed(false);
    verification.setExpiresAt(LocalDateTime.now().plusMinutes(10));

    emailVerificationRepository.save(verification);

    log.info("EMAIL VERIFICATION SAVED: rut={} email={} code={} expiresInMinutes=10",
        rutNorm, emailClean, verificationCode);

    try {
      emailService.sendVerificationCode(emailClean, displayName, verificationCode);
      return true;
    } catch (Exception ex) {
      log.error("EMAIL SEND FAIL: rut={} email={} msg={}", rutNorm, emailClean, ex.getMessage(), ex);
      return false;
    }
  }

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

    String estado = (m.getEstadoSindicato() == null ? "" : m.getEstadoSindicato().trim().toUpperCase(Locale.ROOT));
    if (!"ACTIVO".equals(estado)) {
      log.info("Members(DB): rut={} estadoSindicato={} (no ACTIVO)", rutNorm, estado);
      return false;
    }

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
    String r = rut.trim().toUpperCase(Locale.ROOT)
        .replace(".", "")
        .replace("-", "")
        .replace(" ", "");

    if (r.length() < 2) return r;

    return r.substring(0, r.length() - 1) + "-" + r.substring(r.length() - 1);
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