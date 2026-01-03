package uk.ac.uclan.sis.sis_backend.academic_years.dto;

import java.time.LocalDate;

public class AcademicYearResponse {

    private final Long id;
    private final String name;
    private final LocalDate startsOn;
    private final LocalDate endsOn;

    public AcademicYearResponse(Long id, String name, LocalDate startsOn, LocalDate endsOn) {
        this.id = id;
        this.name = name;
        this.startsOn = startsOn;
        this.endsOn = endsOn;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public LocalDate getStartsOn() {
        return startsOn;
    }

    public LocalDate getEndsOn() {
        return endsOn;
    }
}
