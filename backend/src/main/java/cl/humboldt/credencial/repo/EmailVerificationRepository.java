package cl.humboldt.credencial.repo;

import cl.humboldt.credencial.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {
  Optional<EmailVerification> findTopByRutAndCodeAndUsedFalseOrderByCreatedAtDesc(String rut, String code);
}
