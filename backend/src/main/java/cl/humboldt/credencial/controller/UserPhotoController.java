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

        return ResponseEntity.ok(objectName);
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

        GetObjectResponse obj = storage.getPhoto(objectName);

        String contentType = obj.getContentType();
        if (contentType == null || contentType.isBlank()) contentType = "image/jpeg";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .body(new InputStreamResource(obj.getInputStream()));
    }
}
