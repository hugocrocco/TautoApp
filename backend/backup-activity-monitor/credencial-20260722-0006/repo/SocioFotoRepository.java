package cl.humboldt.credencial.repo;

import cl.humboldt.credencial.entity.SocioFoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SocioFotoRepository extends JpaRepository<SocioFoto, Long> {
    Optional<SocioFoto> findByInstitucionIdAndRut(Long institucionId, String rut);
}