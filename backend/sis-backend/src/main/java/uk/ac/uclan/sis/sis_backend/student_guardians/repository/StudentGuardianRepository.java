package uk.ac.uclan.sis.sis_backend.student_guardians.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import uk.ac.uclan.sis.sis_backend.student_guardians.entity.StudentGuardian;
import uk.ac.uclan.sis.sis_backend.student_guardians.entity.StudentGuardianId;

import java.util.List;
import java.util.Optional;

public interface StudentGuardianRepository extends JpaRepository<StudentGuardian, StudentGuardianId> {

    List<StudentGuardian> findByIdStudentId(Long studentId);

    List<StudentGuardian> findByIdGuardianId(Long guardianId);

    Optional<StudentGuardian> findByIdStudentIdAndIdGuardianId(Long studentId, Long guardianId);

    /**
     * When a link is set to primary, we clear primary flags for other guardians on that student.
     * This keeps "primary" meaning something, without needing extra DB constraints.
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