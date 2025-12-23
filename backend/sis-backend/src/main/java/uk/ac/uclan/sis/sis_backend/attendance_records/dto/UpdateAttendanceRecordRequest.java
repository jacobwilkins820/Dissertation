package uk.ac.uclan.sis.sis_backend.attendance_records.dto;

import jakarta.validation.constraints.NotNull;
import uk.ac.uclan.sis.sis_backend.attendance_records.AttendanceStatus;

public class UpdateAttendanceRecordRequest {

    @NotNull
    private AttendanceStatus status;

    private String reason;

    public AttendanceStatus getStatus() { return status; }
    public void setStatus(AttendanceStatus status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
