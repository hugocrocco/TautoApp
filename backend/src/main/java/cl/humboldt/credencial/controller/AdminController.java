package cl.humboldt.credencial.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Admin endpoints (MVP).
 *
 * NOTE: This controller is intentionally minimal so the project compiles cleanly.
 * Real admin features (roles, activar/desactivar socios, listar socios, etc.)
 * will be implemented next.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

  @GetMapping("/health")
  public ResponseEntity<?> health() {
    return ResponseEntity.ok(Map.of(
        "ok", true,
        "service", "credencial-api",
        "area", "admin"
    ));
  }
}