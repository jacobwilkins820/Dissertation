package uk.ac.uclan.sis.sis_backend.enrolments.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uk.ac.uclan.sis.sis_backend.enrolments.entity.Enrolment;

import java.util.List;
import java.util.Optional;

public interface EnrolmentRepository extends JpaRepository<Enrolment, Long> {

    /**
     * Returns true when an enrolment exists for a student, class, and academic year.
     *
     * @param studentId student id
     * @param classId class id
     * @param academicYearId academic year id
     * @return true when enrolment exists
     */
    boolean existsByStudent_IdAndClazz_IdAndAcademicYear_Id(Long studentId, Long classId, Long academicYearId);

    /**
     * Finds an enrolment by student, class, and academic year.
     *
     * @param studentId student id
     * @param classId class id
     * @param academicYearId academic year id
     * @return matching enrolment, when present
     */
    Optional<Enrolment> findByStudent_IdAndClazz_IdAndAcademicYear_Id(Long studentId, Long classId, Long academicYearId);

    /**
     * Returns enrolments for a class and academic year ordered by id.
     *
     * @param classId class id
     * @param academicYearId academic year id
     * @return list of enrolments
     */
    List<Enrolment> findByClazz_IdAndAcademicYear_IdOrderByIdAsc(Long classId, Long academicYearId);

    /**
     * Returns enrolments for a student and academic year ordered by id.
     *
     * @param studentId student id
     * @param academicYearId academic year id
     * @return list of enrolments
     */
    List<Enrolment> findByStudent_IdAndAcademicYear_IdOrderByIdAsc(Long studentId, Long academicYearId);
}
