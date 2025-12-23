package uk.ac.uclan.sis.sis_backend.enrolments.dto;

import java.time.LocalDate;

public class EnrolmentListItemResponse {

    private Long id;
    private Long studentId;
    private Long classId;
    private LocalDate startDate;
    private LocalDate endDate;

    public EnrolmentListItemResponse(Long id, Long studentId, Long classId, LocalDate startDate, LocalDate endDate) {
        this.id = id;
        this.studentId = studentId;
        this.classId = classId;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public Long getId() { return id; }
    public Long getStudentId() { return studentId; }
    public Long getClassId() { return classId; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
}
