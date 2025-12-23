package uk.ac.uclan.sis.sis_backend.attendance_records.dto;

import uk.ac.uclan.sis.sis_backend.attendance_records.AttendanceStatus;

import java.time.LocalDateTime;

public class AttendanceRecordListItemResponse {

    private Long id;
    private Long studentId;
    private AttendanceStatus status;
    private LocalDateTime markedAt;

    public AttendanceRecordListItemResponse(Long id, Long studentId, AttendanceStatus status, LocalDateTime markedAt) {
        this.id = id;
        this.studentId = studentId;
        this.status = status;
        this.markedAt = markedAt;
    }

    public Long getId() { return id; }
    public Long getStudentId() { return studentId; }
    public AttendanceStatus getStatus() { return status; }
    public LocalDateTime getMarkedAt() { return markedAt; }
}
