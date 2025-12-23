package uk.ac.uclan.sis.sis_backend.enrolments.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uk.ac.uclan.sis.sis_backend.enrolments.entity.Enrolment;

import java.util.List;
import java.util.Optional;

public interface EnrolmentRepository extends JpaRepository<Enrolment, Long> {

    boolean existsByStudent_IdAndClazz_IdAndAcademicYear_Id(Long studentId, Long classId, Long academicYearId);

    Optional<Enrolment> findByStudent_IdAndClazz_IdAndAcademicYear_Id(Long studentId, Long classId, Long academicYearId);

    List<Enrolment> findByClazz_IdAndAcademicYear_IdOrderByIdAsc(Long classId, Long academicYearId);

    List<Enrolment> findByStudent_IdAndAcademicYear_IdOrderByIdAsc(Long studentId, Long academicYearId);
}
