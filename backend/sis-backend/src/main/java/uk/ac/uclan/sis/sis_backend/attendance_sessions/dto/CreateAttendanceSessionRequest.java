package uk.ac.uclan.sis.sis_backend.attendance_sessions.dto;

import java.time.LocalDate;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.enums.SessionPart;

public class CreateAttendanceSessionRequest {

    private Long classId;
    private LocalDate sessionDate;
    private SessionPart session;

    public Long getClassId() {
        return classId;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public SessionPart getSession() {
        return session;
    }
}
