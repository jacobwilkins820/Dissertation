package uk.ac.uclan.sis.sis_backend.attendance_sessions.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

import uk.ac.uclan.sis.sis_backend.classes.entity.Class;
import uk.ac.uclan.sis.sis_backend.academic_years.entity.AcademicYear;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.enums.SessionPart;

@Entity
@Table(
        name = "attendance_sessions",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_attendance_sessions_unique",
                columnNames = {"class_id", "session_date", "session"}
        )
)
public class AttendanceSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id", nullable = false)
    private AcademicYear academicYear;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private Class clazz; // renamed to clazz to avoid conflict with Java keyword

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "session", nullable = false, length = 10)
    private SessionPart session;

    protected AttendanceSession() {
        // default constructor
    }

    public AttendanceSession(AcademicYear academicYear, Class clazz, LocalDate sessionDate, SessionPart session) {
        this.academicYear = academicYear;
        this.clazz = clazz;
        this.sessionDate = sessionDate;
        this.session = session;
    }

    public Long getId() {
        return id;
    }

    public AcademicYear getAcademicYear() {
        return academicYear;
    }

    public Class getClazz() {
        return clazz;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public SessionPart getSession() {
        return session;
    }
}
