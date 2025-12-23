package uk.ac.uclan.sis.sis_backend.enrolments.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class UpdateEnrolmentRequest {

    @NotNull
    private LocalDate startDate;

    private LocalDate endDate; // nullable

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
}
