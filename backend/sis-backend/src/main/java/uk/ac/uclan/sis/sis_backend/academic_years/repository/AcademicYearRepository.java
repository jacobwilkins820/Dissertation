package uk.ac.uclan.sis.sis_backend.academic_years.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import uk.ac.uclan.sis.sis_backend.academic_years.entity.AcademicYear;

import java.time.LocalDate;
import java.util.Optional;

public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {

    Optional<AcademicYear> findByName(String name);

    @Query("""
        SELECT ay
        FROM AcademicYear ay
        WHERE :date BETWEEN ay.startsOn AND ay.endsOn
        """)
    Optional<AcademicYear> findByDate(@Param("date") LocalDate date);
}
