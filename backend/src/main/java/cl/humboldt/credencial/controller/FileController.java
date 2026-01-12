package cl.humboldt.credencial.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.nio.file.*;

@RestController
@RequestMapping("/api/files")
public class FileController {

  @Value("${app.upload-dir:uploads}")
  private String uploadDir;

  @GetMapping("/{filename}")
  public ResponseEntity<?> get(@PathVariable String filename) throws Exception {
    Path file = Paths.get(uploadDir).resolve(filename).normalize();
    if (!Files.exists(file)) return ResponseEntity.notFound().build();

    UrlResource resource = new UrlResource(file.toUri());
    return ResponseEntity.ok()
        .contentType(MediaType.IMAGE_JPEG) // MVP: después detectamos por extensión
        .cacheControl(CacheControl.noStore())
        .body(resource);
  }
}