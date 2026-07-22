package cl.humboldt.credencial.service;

import cl.humboldt.credencial.entity.ActivityEvent;
import cl.humboldt.credencial.repo.ActivityEventRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

@Service
public class ActivityEventService {

    private final ActivityEventRepository repository;

    public ActivityEventService(ActivityEventRepository repository) {
        this.repository = repository;
    }

    public void record(
            Long institucionId,
            String rut,
            String displayName,
            String eventType,
            String result,
            String details,
            HttpServletRequest request
    ) {
        try {
            ActivityEvent event = new ActivityEvent();

            event.setInstitucionId(institucionId);
            event.setRut(rut);
            event.setDisplayName(displayName);
            event.setEventType(eventType);
            event.setResult(result);
            event.setDetails(details);

            if (request != null) {
                event.setIpAddress(resolveIp(request));
                event.setUserAgent(request.getHeader("User-Agent"));
            }

            repository.save(event);

        } catch (Exception ex) {
            System.err.println(
                    "No se pudo guardar evento de actividad: "
                            + ex.getMessage()
            );
        }
    }

    private String resolveIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");

        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }
}