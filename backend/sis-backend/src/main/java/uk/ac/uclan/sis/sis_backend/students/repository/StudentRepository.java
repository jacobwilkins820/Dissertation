package uk.ac.uclan.sis.sis_backend.students.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import uk.ac.uclan.sis.sis_backend.students.entity.Student;

import java.util.Optional;

/**
 * JPA repository for Student.
 * The extra methods help us enforce UPN uniqueness and support fast searching.
 */
public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByUpn(String upn);

    boolean existsByUpn(String upn);

    /**
     * Basic style search.
     * Matches first name, last name, or UPN using a case-insensitive contains search.
     */
    @Query("""
        SELECT s
        FROM Student s
        WHERE LOWER(s.firstName) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(s.lastName)  LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(s.upn)       LIKE LOWER(CONCAT('%', :term, '%'))
    """)
    Page<Student> search(@Param("term") String term, Pageable pageable);
}
