package uk.ac.uclan.sis.sis_backend.attendance_records.dto;

import jakarta.validation.constraints.NotNull;
import uk.ac.uclan.sis.sis_backend.attendance_records.AttendanceStatus;

public class CreateAttendanceRecordRequest {

    @NotNull
    private Long attendanceSessionId;

    @NotNull
    private Long studentId;

    @NotNull
    private AttendanceStatus status;

    private String reason;

    public Long getAttendanceSessionId() { return attendanceSessionId; }
    public void setAttendanceSessionId(Long attendanceSessionId) { this.attendanceSessionId = attendanceSessionId; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public AttendanceStatus getStatus() { return status; }
    public void setStatus(AttendanceStatus status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
