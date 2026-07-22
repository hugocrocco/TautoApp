package cl.humboldt.credencial.controller;

import cl.humboldt.credencial.service.UserPhotoStorageService;
import com.oracle.bmc.objectstorage.responses.GetObjectResponse;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/photos")
public class UserPhotoController {

    private static final long MAX_FILE_SIZE = 5L * 1024L * 1024L;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final UserPhotoStorageService storage;

    public UserPhotoController(UserPhotoStorageService storage) {
        this.storage = storage;
    }

    @PostMapping(
            value = "/{institucionId}/{rut}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> upload(
            @PathVariable Long institucionId,
            @PathVariable String rut,
            @RequestParam("file") MultipartFile file
    ) throws Exception {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "ok", false,
                    "message", "Debes seleccionar una fotografía."
            ));
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of(
                    "ok", false,
                    "message", "La fotografía no puede superar los 5 MB."
            ));
        }

        String contentType = file.getContentType();

        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "ok", false,
                    "message", "Solo se permiten imágenes JPG, PNG o WEBP."
            ));
        }

        String objectName = storage.buildObjectName(institucionId, rut);

        try (InputStream inputStream = file.getInputStream()) {
            storage.uploadPhoto(
                    objectName,
                    inputStream,
                    file.getSize(),
                    contentType
            );
        }

        String photoUrl =
                "/api/photos/"
                        + institucionId
                        + "/"
                        + rut
                        + "?v="
                        + System.currentTimeMillis();

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "Fotografía actualizada correctamente.",
                "objectName", objectName,
                "photoUrl", photoUrl
        ));
    }

    @GetMapping("/{institucionId}/{rut}")
    public ResponseEntity<InputStreamResource> view(
            @PathVariable Long institucionId,
            @PathVariable String rut
    ) throws Exception {

        String objectName = storage.buildObjectName(institucionId, rut);

        if (!storage.exists(objectName)) {
            return ResponseEntity.notFound().build();
        }

        GetObjectResponse object = storage.getPhoto(objectName);

        String contentType = object.getContentType();

        if (contentType == null || contentType.isBlank()) {
            contentType = "image/jpeg";
        }

        return ResponseEntity.ok()
                .cacheControl(
                        CacheControl.maxAge(5, TimeUnit.MINUTES)
                                .cachePublic()
                )
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .body(new InputStreamResource(object.getInputStream()));
    }
}