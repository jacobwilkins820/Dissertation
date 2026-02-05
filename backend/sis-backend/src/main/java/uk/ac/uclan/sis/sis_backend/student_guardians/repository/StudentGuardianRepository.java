package uk.ac.uclan.sis.sis_backend.student_guardians.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import uk.ac.uclan.sis.sis_backend.student_guardians.entity.StudentGuardian;
import uk.ac.uclan.sis.sis_backend.student_guardians.entity.StudentGuardianId;

import java.util.List;
import java.util.Optional;

public interface StudentGuardianRepository extends JpaRepository<StudentGuardian, StudentGuardianId> {

    /**
     * Returns links by student id.
     *
     * @param studentId student id
     * @return list of links
     */
    List<StudentGuardian> findByIdStudentId(Long studentId);

    /**
     * Returns links by guardian id.
     *
     * @param guardianId guardian id
     * @return list of links
     */
    List<StudentGuardian> findByIdGuardianId(Long guardianId);

    /**
     * Finds a link by student id and guardian id.
     *
     * @param studentId student id
     * @param guardianId guardian id
     * @return matching link, when present
     */
    Optional<StudentGuardian> findByIdStudentIdAndIdGuardianId(Long studentId, Long guardianId);

    /**
     * Clears primary flags for other guardians on a student.
     * This keeps "primary" meaningful without extra DB constraints.
     *
     * @param studentId student id
     * @param guardianId guardian id to keep as primary
     * @return number of rows updated
     */
    @Modifying
    @Query("""
        update StudentGuardian sg
        set sg.isPrimary = false
        where sg.id.studentId = :studentId
          and sg.id.guardianId <> :guardianId
          and sg.isPrimary = true
    """)
    int clearOtherPrimaryGuardians(Long studentId, Long guardianId);
}
