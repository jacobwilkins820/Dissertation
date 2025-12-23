package uk.ac.uclan.sis.sis_backend.enrolments.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class EnrolmentResponse {

    private Long id;
    private Long studentId;
    private Long classId;
    private Long academicYearId;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public EnrolmentResponse(
            Long id,
            Long studentId,
            Long classId,
            Long academicYearId,
            LocalDate startDate,
            LocalDate endDate,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.studentId = studentId;
        this.classId = classId;
        this.academicYearId = academicYearId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public Long getStudentId() { return studentId; }
    public Long getClassId() { return classId; }
    public Long getAcademicYearId() { return academicYearId; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
