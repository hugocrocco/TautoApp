package cl.humboldt.credencial.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AdminKeyFilter extends OncePerRequestFilter {

  @Value("${app.admin-key:CHANGE_ME}")
  private String adminKey;

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String path = request.getRequestURI();

    // Solo protege /api/admin/**
    if (!path.startsWith("/api/admin")) {
      filterChain.doFilter(request, response);
      return;
    }

    String key = request.getHeader("X-ADMIN-KEY");
    if (key == null || key.isBlank() || !key.equals(adminKey)) {
      response.setStatus(403);
      response.setContentType("application/json");
      response.getWriter().write("{\"ok\":false,\"message\":\"Acceso admin requerido\"}");
      return;
    }

    filterChain.doFilter(request, response);
  }
}