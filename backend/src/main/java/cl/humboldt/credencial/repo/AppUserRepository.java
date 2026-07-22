package cl.humboldt.credencial.repo;
import cl.humboldt.credencial.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; import java.util.Optional;
public interface AppUserRepository extends JpaRepository<AppUser,Long>{
 Optional<AppUser> findByInstitucionIdAndRut(Long institucionId,String rut);
 Optional<AppUser> findByInstitucionIdAndEmailIgnoreCase(Long institucionId,String email);
 List<AppUser> findAllByInstitucionId(Long institucionId);
 boolean existsByInstitucionIdAndRut(Long institucionId,String rut);
}
