package uk.ac.uclan.sis.sis_backend.academic_years.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import uk.ac.uclan.sis.sis_backend.academic_years.dto.AcademicYearResponse;
import uk.ac.uclan.sis.sis_backend.academic_years.entity.AcademicYear;
import uk.ac.uclan.sis.sis_backend.academic_years.service.AcademicYearService;

@RestController
@RequestMapping("/api/academic-years")
public class AcademicYearController {

    private final AcademicYearService academicYearService;

    /**
     * Sets up the academic year controller.
     *
     * @param academicYearService service for academic year access
     */
    public AcademicYearController(AcademicYearService academicYearService) {
        this.academicYearService = academicYearService;
    }

    /**
     * Gets the current academic year.
     *
     * @return academic year response
     */
    @GetMapping("/current")
    public AcademicYearResponse getCurrent() {
        AcademicYear current = academicYearService.getCurrentOrThrow();
        return new AcademicYearResponse(
                current.getId(),
                current.getName(),
                current.getStartsOn(),
                current.getEndsOn()
        );
    }
}
