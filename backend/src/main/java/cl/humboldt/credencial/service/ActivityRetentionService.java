package cl.humboldt.credencial.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class ActivityRetentionService {

  private static final Logger log =
      LoggerFactory.getLogger(ActivityRetentionService.class);

  private final JdbcTemplate jdbc;

  public ActivityRetentionService(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  /*
   * Se ejecuta todos los días a las 03:15, hora de Santiago.
   * Elimina únicamente eventos con más de 12 meses.
   */
  @Scheduled(
      cron = "0 15 3 * * *",
      zone = "America/Santiago"
  )
  public void deleteExpiredActivityEvents() {
    int deleted = jdbc.update("""
        DELETE FROM activity_events
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 12 MONTH)
        """);

    log.info(
        "ACTIVITY RETENTION: deleted={} retentionMonths=12",
        deleted
    );
  }
}