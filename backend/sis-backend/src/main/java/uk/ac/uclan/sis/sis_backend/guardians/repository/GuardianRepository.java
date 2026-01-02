package uk.ac.uclan.sis.sis_backend.guardians.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uk.ac.uclan.sis.sis_backend.guardians.entity.Guardian;

public interface GuardianRepository extends JpaRepository<Guardian, Long> {

    /**
     * search used for:
     * - admin paginated lists
     * - autocomplete / linking (with small page size)
     *
     * Case-insensitive search over:
     * - first name
     * - last name
     * - full name
     * - email
     */
    @Query("""
        SELECT g
        FROM Guardian g
        WHERE LOWER(g.firstName) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(g.lastName) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(CONCAT(g.firstName, ' ', g.lastName)) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(g.email) LIKE LOWER(CONCAT('%', :query, '%'))
    """)
    Page<Guardian> search(
            @Param("query") String query,
            Pageable pageable
    );

    boolean existsByEmailIgnoreCase(String email);
}
