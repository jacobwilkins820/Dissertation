package uk.ac.uclan.sis.sis_backend.attendance_sessions.dto;

import java.time.LocalDate;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.enums.SessionPart;

public class AttendanceSessionResponse {

    private final Long id;
    private final Long classId;

    private final Long academicYearId;
    private final String academicYearName;

    private final LocalDate sessionDate;
    private final SessionPart session;

    public AttendanceSessionResponse(
            Long id,
            Long classId,
            Long academicYearId,
            String academicYearName,
            LocalDate sessionDate,
            SessionPart session
    ) {
        this.id = id;
        this.classId = classId;
        this.academicYearId = academicYearId;
        this.academicYearName = academicYearName;
        this.sessionDate = sessionDate;
        this.session = session;
    }

    public Long getId() { return id; }
    public Long getClassId() { return classId; }

    public Long getAcademicYearId() { return academicYearId; }
    public String getAcademicYearName() { return academicYearName; }

    public LocalDate getSessionDate() { return sessionDate; }
    public SessionPart getSession() { return session; }
}
