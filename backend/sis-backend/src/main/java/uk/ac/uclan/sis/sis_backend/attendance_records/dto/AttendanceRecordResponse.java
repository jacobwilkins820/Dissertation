package uk.ac.uclan.sis.sis_backend.attendance_records.dto;

import uk.ac.uclan.sis.sis_backend.attendance_records.AttendanceStatus;

import java.time.LocalDateTime;

public class AttendanceRecordResponse {

    private Long id;
    private Long attendanceSessionId;
    private Long studentId;
    private Long markedByUserId; // nullable
    private AttendanceStatus status;
    private String reason; // nullable
    private LocalDateTime markedAt; // nullable
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AttendanceRecordResponse(
            Long id,
            Long attendanceSessionId,
            Long studentId,
            Long markedByUserId,
            AttendanceStatus status,
            String reason,
            LocalDateTime markedAt,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.attendanceSessionId = attendanceSessionId;
        this.studentId = studentId;
        this.markedByUserId = markedByUserId;
        this.status = status;
        this.reason = reason;
        this.markedAt = markedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public Long getAttendanceSessionId() { return attendanceSessionId; }
    public Long getStudentId() { return studentId; }
    public Long getMarkedByUserId() { return markedByUserId; }
    public AttendanceStatus getStatus() { return status; }
    public String getReason() { return reason; }
    public LocalDateTime getMarkedAt() { return markedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
