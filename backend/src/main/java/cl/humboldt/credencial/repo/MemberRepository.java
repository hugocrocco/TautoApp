package cl.humboldt.credencial.repo;
import cl.humboldt.credencial.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; import java.util.Optional;
public interface MemberRepository extends JpaRepository<Member,Long>{
 Optional<Member> findByInstitucionIdAndRut(Long institucionId,String rut);
 boolean existsByInstitucionIdAndRut(Long institucionId,String rut);
 List<Member> findAllByInstitucionId(Long institucionId);
}
