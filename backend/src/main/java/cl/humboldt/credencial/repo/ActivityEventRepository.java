package cl.humboldt.credencial.repo;

import cl.humboldt.credencial.entity.ActivityEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityEventRepository
        extends JpaRepository<ActivityEvent, Long> {
}