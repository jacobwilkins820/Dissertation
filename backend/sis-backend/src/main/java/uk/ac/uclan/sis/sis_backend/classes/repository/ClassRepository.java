package uk.ac.uclan.sis.sis_backend.classes.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uk.ac.uclan.sis.sis_backend.classes.entity.Class;

import java.util.Optional;

public interface ClassRepository extends JpaRepository<Class, Long> {
    Optional<Class> findByCode(String code);
    boolean existsByCode(String code);
}
