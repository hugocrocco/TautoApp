package cl.humboldt.credencial.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AdminKeyFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(AdminKeyFilter.class);

  @Value("${app.admin-key:hbdt}")
  private String adminKey;

  @Override
  protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain)
      throws ServletException, IOException {

    String path = request.getRequestURI();

    if (!path.startsWith("/api/admin")) {
      filterChain.doFilter(request, response);
      return;
    }

    String origin = request.getHeader("Origin");
    if (origin != null && (
        origin.equals("http://localhost:5173") ||
        origin.equals("http://192.168.1.7:5173") ||
        origin.equals("https://tauto.cl") ||
        origin.equals("https://www.tauto.cl")||
        origin.equals("https://hbdt.tauto.cl")
    )) {
      response.setHeader("Access-Control-Allow-Origin", origin);
    }

    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-ADMIN-KEY");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
      response.setStatus(HttpServletResponse.SC_OK);
      return;
    }

    if (path.equals("/api/admin/health") || path.equals("/api/admin/members/health")) {
      filterChain.doFilter(request, response);
      return;
    }

    String key = request.getHeader("X-ADMIN-KEY");

    String expected = adminKey == null ? "" : adminKey.trim();
    String received = key == null ? "" : key.trim();

    log.info("ADMIN FILTER: path={} receivedKeyLength={} expectedKeyLength={}",
        path,
        received.length(),
        expected.length()
    );

    if (received.isBlank() || !received.equals(expected)) {
      response.setStatus(HttpServletResponse.SC_FORBIDDEN);
      response.setContentType("application/json;charset=UTF-8");
      response.getWriter().write("{\"ok\":false,\"message\":\"Acceso admin requerido\"}");
      return;
    }

    filterChain.doFilter(request, response);
  }
}