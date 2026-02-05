package uk.ac.uclan.sis.sis_backend.academic_years.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import uk.ac.uclan.sis.sis_backend.academic_years.entity.AcademicYear;
import uk.ac.uclan.sis.sis_backend.academic_years.repository.AcademicYearRepository;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

import java.time.LocalDate;

@Service
public class AcademicYearService {

    private final AcademicYearRepository academicYearRepository;

    /**
     * Creates the academic year service.
     *
     * @param academicYearRepository repository for academic years
     */
    public AcademicYearService(AcademicYearRepository academicYearRepository) {
        this.academicYearRepository = academicYearRepository;
    }

    /**
     * Returns the academic year covering the given date.
     *
     * @param date target date
     * @return academic year entity
     */
    public AcademicYear getForDateOrThrow(LocalDate date) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        return academicYearRepository.findByDate(date)
                .orElseThrow(() -> new IllegalStateException(
                        "No academic_years row covers date: " + date + ". Seed/migrate academic_years."
                ));
    }

    /**
     * Returns the academic year covering the current date.
     *
     * @return academic year entity
     */
    public AcademicYear getCurrentOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return getForDateOrThrow(LocalDate.now());
    }
}
