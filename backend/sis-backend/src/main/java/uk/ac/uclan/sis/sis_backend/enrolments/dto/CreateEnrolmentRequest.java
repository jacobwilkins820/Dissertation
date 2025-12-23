package uk.ac.uclan.sis.sis_backend.enrolments.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class CreateEnrolmentRequest {

    @NotNull
    private Long studentId;

    @NotNull
    private Long classId;

    @NotNull
    private Long academicYearId;

    @NotNull
    private LocalDate startDate;

    private LocalDate endDate; // nullable

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Long getClassId() { return classId; }
    public void setClassId(Long classId) { this.classId = classId; }

    public Long getAcademicYearId() { return academicYearId; }
    public void setAcademicYearId(Long academicYearId) { this.academicYearId = academicYearId; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
}
