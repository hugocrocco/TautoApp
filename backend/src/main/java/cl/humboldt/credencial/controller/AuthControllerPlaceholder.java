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
import cl.humboldt.credencial.util.RutUtils;
import cl.humboldt.credencial.service.ActivityEventService;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;


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
  private final ActivityEventService activityEventService;
  private final String bucketName;

  public AuthControllerPlaceholder(
    UserPhotoStorageService storageService,
    SocioFotoRepository socioFotoRepository,
    MemberRepository memberRepository,
    AppUserRepository appUserRepository,
    EmailVerificationRepository emailVerificationRepository,
    EmailService emailService,
    ActivityEventService activityEventService,
    @Value("${oci.objectstorage.bucket}") String bucketName
) {
    this.storageService = storageService;
    this.socioFotoRepository = socioFotoRepository;
    this.memberRepository = memberRepository;
    this.appUserRepository = appUserRepository;
    this.emailVerificationRepository = emailVerificationRepository;
    this.emailService = emailService;
    this.activityEventService = activityEventService;
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
    public Long institucionId;
  }

  @PostMapping(
      value = "/register",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> registerJson(@RequestBody RegisterJsonRequest req) throws Exception {
    Long institucionId = (req == null || req.institucionId == null) ? 1L : req.institucionId;
    String rut = (req == null || req.rut == null) ? "" : req.rut;
    String password = (req == null || req.password == null) ? "" : req.password;
    String emailClean = normalizeEmail(req == null ? "" : req.email);
    String rutNorm = RutUtils.normalize(rut);

    log.info("REGISTER(JSON): rut={} email={} hasPhoto=false", rutNorm, emailClean);

    if (rutNorm.isEmpty() || password.isBlank() || emailClean.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "Debes completar RUT, email y contraseña."
      ));
    }

    if (!RutUtils.isValid(rutNorm)) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "El RUT ingresado no es válido."
      ));
    }

    if (password.length() < 6) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "La clave debe tener al menos 6 caracteres."
      ));
    }

    var memberOpt = findActiveMemberByRut(institucionId, rutNorm);
    if (memberOpt.isEmpty()) {
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "No encontramos tu RUT como socio activo en el padrón del sindicato."
      ));
    }

    String officialDisplayName = cleanDisplayName(memberOpt.get().getNombreCompleto());
    String passwordHash = BCrypt.hashpw(password, BCrypt.gensalt(10));
    String credentialCode = "HUMB-" + String.format("%03d", (int) (Math.random() * 900 + 100));
    String verificationCode = generateVerificationCode();

    boolean emailSent = savePendingUserAndVerificationCode(
        institucionId,
        rutNorm,
        officialDisplayName,
        emailClean,
        passwordHash,
        verificationCode
    );

    log.info("EMAIL VERIFICATION PREPARED(JSON): rut={} email={} code={} sent={}",
        rutNorm, emailClean, verificationCode, emailSent);

    return ResponseEntity.ok(Map.ofEntries(
        Map.entry("ok", true),
        Map.entry("displayName", officialDisplayName),
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
public ResponseEntity<?> login(
    @RequestBody LoginJsonRequest req,
    HttpServletRequest httpRequest
) {
    String rut = (req == null || req.rut == null) ? "" : req.rut;
    String password = (req == null || req.password == null) ? "" : req.password;
    Long institucionId =
        (req == null || req.institucionId == null)
            ? 1L
            : req.institucionId;

    String rutNorm = RutUtils.normalize(rut);

    if (rutNorm.isEmpty() || password.isBlank()) {
        activityEventService.record(
            institucionId,
            rutNorm,
            null,
            "LOGIN_FAILED",
            "INVALID_REQUEST",
            "Intento de ingreso sin completar RUT o contraseña.",
            httpRequest
        );

        return ResponseEntity.badRequest().body(Map.of(
            "ok", false,
            "message", "Completa RUT y contraseña."
        ));
    }

    var memberOpt = memberRepository.findByInstitucionIdAndRut(institucionId, rutNorm);

    if (memberOpt.isEmpty()) {
        log.info(
            "LOGIN FAIL: rut={} motivo=no existe en padrón",
            rutNorm
        );

        activityEventService.record(
            institucionId,
            rutNorm,
            null,
            "LOGIN_FAILED",
            "MEMBER_NOT_FOUND",
            "El RUT no existe en el padrón.",
            httpRequest
        );

        return ResponseEntity.status(403).body(Map.of(
            "ok", false,
            "message", "No encontramos tu RUT en el padrón del sindicato."
        ));
    }

    Member member = memberOpt.get();

    String estado = member.getEstadoSindicato() == null
        ? ""
        : member.getEstadoSindicato()
            .trim()
            .toUpperCase(Locale.ROOT);

    if (!"ACTIVO".equals(estado)) {
        log.info(
            "LOGIN FAIL: rut={} motivo=socio no activo estado={}",
            rutNorm,
            estado
        );

        activityEventService.record(
            institucionId,
            rutNorm,
            member.getNombreCompleto(),
            "LOGIN_BLOCKED",
            "MEMBER_NOT_ACTIVE",
            "Acceso bloqueado. Estado del socio: " + estado,
            httpRequest
        );

        return ResponseEntity.status(403).body(Map.of(
            "ok", false,
            "message", "Tu cuenta no está activa en el sindicato."
        ));
    }

    var userOpt = appUserRepository.findByInstitucionIdAndRut(institucionId, rutNorm);

    if (userOpt.isEmpty()) {
        log.info(
            "LOGIN FAIL: rut={} motivo=no registrado en app_users",
            rutNorm
        );

        activityEventService.record(
            institucionId,
            rutNorm,
            member.getNombreCompleto(),
            "LOGIN_FAILED",
            "USER_NOT_REGISTERED",
            "El socio existe en el padrón, pero no está registrado en la aplicación.",
            httpRequest
        );

        return ResponseEntity.status(403).body(Map.of(
            "ok", false,
            "message", "Debes registrarte antes de iniciar sesión."
        ));
    }

    AppUser user = userOpt.get();

    if (!BCrypt.checkpw(password, user.getPasswordHash())) {
        log.info(
            "LOGIN FAIL: rut={} motivo=password incorrecta",
            rutNorm
        );

        activityEventService.record(
            institucionId,
            rutNorm,
            user.getDisplayName(),
            "LOGIN_FAILED",
            "WRONG_PASSWORD",
            "Contraseña incorrecta.",
            httpRequest
        );

        return ResponseEntity.status(403).body(Map.of(
            "ok", false,
            "message", "RUT o contraseña incorrectos."
        ));
    }

    if (!user.isEmailVerified()) {
        log.info(
            "LOGIN FAIL: rut={} motivo=email no verificado",
            rutNorm
        );

        activityEventService.record(
            institucionId,
            rutNorm,
            user.getDisplayName(),
            "LOGIN_BLOCKED",
            "EMAIL_NOT_VERIFIED",
            "El usuario intentó ingresar sin verificar su correo.",
            httpRequest
        );

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

    log.info(
        "LOGIN OK: rut={} email={}",
        rutNorm,
        user.getEmail()
    );

    activityEventService.record(
        institucionId,
        rutNorm,
        user.getDisplayName(),
        "LOGIN_SUCCESS",
        "SUCCESS",
        "Inicio de sesión correcto.",
        httpRequest
    );

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
    String rutNorm = RutUtils.normalize(req == null ? "" : req.rut);
    String code = (req == null || req.code == null) ? "" : req.code.trim();
    Long institucionId = (req == null || req.institucionId == null) ? 1L : req.institucionId;

    if (rutNorm.isEmpty() || code.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "Debes ingresar RUT y código."
      ));
    }

    var userOpt = appUserRepository.findByInstitucionIdAndRut(institucionId, rutNorm);
    if (userOpt.isEmpty()) {
      return ResponseEntity.status(404).body(Map.of(
          "ok", false,
          "message", "No existe un usuario registrado con ese RUT."
      ));
    }

    var verificationOpt = emailVerificationRepository
        .findTopByInstitucionIdAndRutAndCodeAndUsedFalseOrderByCreatedAtDesc(institucionId, rutNorm, code);

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
      @RequestParam(required = false, defaultValue = "") String displayName,
      @RequestParam String rut,
      @RequestParam String password,
      @RequestParam(required = false, defaultValue = "") String email,
      @RequestPart(required = false) MultipartFile photo
  ) throws Exception {

    String emailClean = normalizeEmail(email);
    String rutNorm = RutUtils.normalize(rut);

    log.info("REGISTER(MULTIPART) HIT: institucionId={} rut={} email={} hasPhotoParam={}",
        institucionId,
        rutNorm,
        emailClean,
        (photo != null)
    );

    if (rutNorm.isEmpty() || password.isBlank() || emailClean.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "Debes completar RUT, email y contraseña."
      ));
    }

    if (!RutUtils.isValid(rutNorm)) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "El RUT ingresado no es válido."
      ));
    }

    if (password.length() < 6) {
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "message", "La clave debe tener al menos 6 caracteres."
      ));
    }

    var memberOpt = findActiveMemberByRut(institucionId, rutNorm);
    if (memberOpt.isEmpty()) {
      return ResponseEntity.status(403).body(Map.of(
          "ok", false,
          "message", "No encontramos tu RUT como socio activo en el padrón del sindicato."
      ));
    }

    String officialDisplayName = cleanDisplayName(memberOpt.get().getNombreCompleto());
    String passwordHash = BCrypt.hashpw(password, BCrypt.gensalt(10));

    if (photo == null) {
      log.info("REGISTER: rut={} displayName={} photo=NULL", rutNorm, officialDisplayName);
    } else {
      log.info("REGISTER: rut={} displayName={} photoName={} size={} contentType={} empty={}",
          rutNorm,
          officialDisplayName,
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
        institucionId,
        rutNorm,
        officialDisplayName,
        emailClean,
        passwordHash,
        verificationCode
    );

    log.info("EMAIL VERIFICATION PREPARED(MULTIPART): rut={} email={} code={} sent={}",
        rutNorm, emailClean, verificationCode, emailSent);

    return ResponseEntity.ok(Map.ofEntries(
        Map.entry("ok", true),
        Map.entry("displayName", officialDisplayName),
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
      Long institucionId,
      String rutNorm,
      String displayName,
      String emailClean,
      String passwordHash,
      String verificationCode
  ) {
    AppUser user = appUserRepository.findByInstitucionIdAndRut(institucionId, rutNorm).orElseGet(AppUser::new);

    user.setInstitucionId(institucionId);

    user.setRut(rutNorm);
    user.setDisplayName(displayName.trim().replaceAll("\\s+", " "));
    user.setEmail(emailClean);
    user.setPasswordHash(passwordHash);
    user.setEmailVerified(false);
    user.setStatus("PENDING_EMAIL_VERIFICATION");

    appUserRepository.save(user);

    EmailVerification verification = new EmailVerification();
    verification.setInstitucionId(institucionId);
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

  private java.util.Optional<Member> findActiveMemberByRut(Long institucionId, String rut) {
    String rutNorm = RutUtils.normalize(rut);

    if (rutNorm.isEmpty()) {
      return java.util.Optional.empty();
    }

    var opt = memberRepository.findByInstitucionIdAndRut(institucionId, rutNorm);
    if (opt.isEmpty()) {
      log.info("Members(DB): no existe rut={}", rutNorm);
      return java.util.Optional.empty();
    }

    Member member = opt.get();
    String estado = member.getEstadoSindicato() == null
        ? ""
        : member.getEstadoSindicato().trim().toUpperCase(Locale.ROOT);

    if (!"ACTIVO".equals(estado)) {
      log.info("Members(DB): rut={} estadoSindicato={} (no ACTIVO)", rutNorm, estado);
      return java.util.Optional.empty();
    }

    return java.util.Optional.of(member);
  }

  private String cleanDisplayName(String name) {
    if (name == null) {
      return "";
    }
    return name.trim().replaceAll("\\s+", " ");
  }

  private String normalizeEmail(String email) {
    if (email == null) return "";
    return email.trim().toLowerCase(Locale.ROOT);
  }

  private String generateVerificationCode() {
    return String.format("%06d", (int) (Math.random() * 900000) + 100000);
  }


  private String maskRut(String rut) {
    String clean = rut == null ? "" : rut.replace(".", "").trim();
    if (clean.length() < 4) return "****";
    return clean.substring(0, Math.min(6, clean.length())) + ".***-*";
  }
}