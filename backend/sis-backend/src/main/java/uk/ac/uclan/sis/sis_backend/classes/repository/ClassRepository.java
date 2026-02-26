package uk.ac.uclan.sis.sis_backend.classes.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uk.ac.uclan.sis.sis_backend.classes.entity.Class;

import java.util.Optional;

public interface ClassRepository extends JpaRepository<Class, Long> {
    /**
     * Finds a class by code.
     *
     * @param code class code
     * @return matching class, when present
     */
    Optional<Class> findByCode(String code);

    /**
     * Gets true when a class code already exists.
     *
     * @param code class code
     * @return true when code exists
     */
    boolean existsByCode(String code);
}
