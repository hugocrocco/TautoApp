package cl.humboldt.credencial.repo;

import cl.humboldt.credencial.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
  Optional<AppUser> findByRut(String rut);
  Optional<AppUser> findByEmail(String email);
}
