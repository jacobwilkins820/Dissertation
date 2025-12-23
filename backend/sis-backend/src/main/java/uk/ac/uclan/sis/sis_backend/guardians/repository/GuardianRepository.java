package uk.ac.uclan.sis.sis_backend.guardians.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uk.ac.uclan.sis.sis_backend.guardians.entity.Guardian;

public interface GuardianRepository extends JpaRepository<Guardian, Long> {

    /**
     * Case-insensitive "contains" search over first + last name.
     * Parameterised query => safe from SQL injection.
     */
    @Query("""
        SELECT g
        FROM Guardian g
        WHERE LOWER(g.firstName) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(g.lastName)  LIKE LOWER(CONCAT('%', :term, '%'))
    """)
    Page<Guardian> searchByName(@Param("term") String term, Pageable pageable);

    boolean existsByEmailIgnoreCase(String email);
}
