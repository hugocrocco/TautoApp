package cl.humboldt.credencial.repo;

import cl.humboldt.credencial.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByRut(String rut);
    boolean existsByRut(String rut);
}