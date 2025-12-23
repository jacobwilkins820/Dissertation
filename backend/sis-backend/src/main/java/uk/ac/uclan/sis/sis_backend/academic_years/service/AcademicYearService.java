package uk.ac.uclan.sis.sis_backend.academic_years.service;

import org.springframework.stereotype.Service;

import uk.ac.uclan.sis.sis_backend.academic_years.entity.AcademicYear;
import uk.ac.uclan.sis.sis_backend.academic_years.repository.AcademicYearRepository;

import java.time.LocalDate;

@Service
public class AcademicYearService {

    private final AcademicYearRepository academicYearRepository;

    public AcademicYearService(AcademicYearRepository academicYearRepository) {
        this.academicYearRepository = academicYearRepository;
    }

    public AcademicYear getForDateOrThrow(LocalDate date) {
        return academicYearRepository.findByDate(date)
                .orElseThrow(() -> new IllegalStateException(
                        "No academic_years row covers date: " + date + ". Seed/migrate academic_years."
                ));
    }

    public AcademicYear getCurrentOrThrow() {
        return getForDateOrThrow(LocalDate.now());
    }
}
