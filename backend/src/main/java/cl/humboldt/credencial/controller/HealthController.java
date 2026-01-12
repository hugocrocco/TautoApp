package cl.humboldt.credencial.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "ok",
                "service", "credencial-api"
        );
    }

    @GetMapping("/")
    public Map<String, Object> root() {
        return Map.of(
                "message", "API Credencial Sindicato Humboldt",
                "health", "/api/health"
        );
    }
}
