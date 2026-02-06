package uk.ac.uclan.sis.sis_backend.attendance_records.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import uk.ac.uclan.sis.sis_backend.attendance_records.AttendanceStatus;

import java.util.List;

public class SaveAttendanceForSessionRequest {

    @Valid
    @NotNull
    private List<AttendanceMarkRequest> records;

    public List<AttendanceMarkRequest> getRecords() {
        return records;
    }

    public void setRecords(List<AttendanceMarkRequest> records) {
        this.records = records;
    }

    public static class AttendanceMarkRequest {
        @NotNull
        private Long studentId;

        @NotNull
        private AttendanceStatus status;

        private String reason;

        public Long getStudentId() {
            return studentId;
        }

        public void setStudentId(Long studentId) {
            this.studentId = studentId;
        }

        public AttendanceStatus getStatus() {
            return status;
        }

        public void setStatus(AttendanceStatus status) {
            this.status = status;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}
