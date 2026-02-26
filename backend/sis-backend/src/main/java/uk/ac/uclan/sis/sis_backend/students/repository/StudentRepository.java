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
 * The extra methods enforce UPN uniqueness and support searching.
 */
public interface StudentRepository extends JpaRepository<Student, Long> {

    /**
     * Finds a student by UPN.
     *
     * @param upn unique pupil number
     * @return matching student, when present
     */
    Optional<Student> findByUpn(String upn);

    /**
     * Gets true when a UPN already exists.
     *
     * @param upn unique pupil number
     * @return true when UPN exists
     */
    boolean existsByUpn(String upn);

    /**
     * Basic style search.
     * Matches first name, last name, or UPN using a case-insensitive contains search.
     *
     * @param term search term
     * @param pageable paging request
     * @return page of students
     */
    @Query("""
        SELECT s
        FROM Student s
        WHERE LOWER(s.firstName) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(s.lastName)  LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(CONCAT(s.firstName, ' ', s.lastName)) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(s.upn)       LIKE LOWER(CONCAT('%', :term, '%'))
    """)
    Page<Student> search(@Param("term") String term, Pageable pageable);

    /**
     * Gets students linked to a guardian.
     *
     * @param guardianId guardian id
     * @param pageable paging request
     * @return page of students
     */
    @Query("""
        SELECT s
        FROM Student s
        JOIN StudentGuardian sg ON sg.student = s
        WHERE sg.guardian.id = :guardianId
    """)
    Page<Student> findByGuardianId(@Param("guardianId") Long guardianId, Pageable pageable);

    /**
     * Searches students linked to a guardian.
     *
     * @param guardianId guardian id
     * @param term search term
     * @param pageable paging request
     * @return page of students
     */
    @Query("""
        SELECT s
        FROM Student s
        JOIN StudentGuardian sg ON sg.student = s
        WHERE sg.guardian.id = :guardianId
          AND (
            LOWER(s.firstName) LIKE LOWER(CONCAT('%', :term, '%'))
            OR LOWER(s.lastName)  LIKE LOWER(CONCAT('%', :term, '%'))
            OR LOWER(CONCAT(s.firstName, ' ', s.lastName)) LIKE LOWER(CONCAT('%', :term, '%'))
            OR LOWER(s.upn)       LIKE LOWER(CONCAT('%', :term, '%'))
          )
    """)
    Page<Student> searchByGuardian(
            @Param("guardianId") Long guardianId,
            @Param("term") String term,
            Pageable pageable
    );
}
