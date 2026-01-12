package cl.humboldt.credencial.controller;

import cl.humboldt.credencial.service.UserPhotoStorageService;
import com.oracle.bmc.objectstorage.responses.GetObjectResponse;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

@RestController
@RequestMapping("/api/photos")
public class UserPhotoController {

    private final UserPhotoStorageService storage;

    public UserPhotoController(UserPhotoStorageService storage) {
        this.storage = storage;
    }

    /**
     * SUBIR FOTO (privada en OCI)
     * POST /api/photos/{institucionId}/{rut}
     * form-data: file=<archivo>
     */
    @PostMapping(value = "/{institucionId}/{rut}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(
            @PathVariable Long institucionId,
            @PathVariable String rut,
            @RequestParam("file") MultipartFile file
    ) throws Exception {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Archivo vacío");
        }

        String objectName = storage.buildObjectName(institucionId, rut);

        try (InputStream in = file.getInputStream()) {
            storage.uploadPhoto(objectName, in, file.getSize(), file.getContentType());
        }

        // Por ahora devolvemos la "key" del objeto (después lo guardas en DB si quieres)
        return ResponseEntity.ok().body(objectName);
    }

    /**
     * VER FOTO (la expone SOLO vía backend; sigue privada en OCI)
     * GET /api/photos/{institucionId}/{rut}
     */
    @GetMapping("/{institucionId}/{rut}")
    public ResponseEntity<InputStreamResource> view(
            @PathVariable Long institucionId,
            @PathVariable String rut
    ) throws Exception {

        String objectName = storage.buildObjectName(institucionId, rut);

        if (!storage.exists(objectName)) {
            return ResponseEntity.notFound().build();
        }

        GetObjectResponse obj = storage.getPhoto(objectName);

        String contentType = obj.getContentType();
        if (contentType == null || contentType.isBlank()) contentType = "image/jpeg";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .body(new InputStreamResource(obj.getInputStream()));
    }
}
