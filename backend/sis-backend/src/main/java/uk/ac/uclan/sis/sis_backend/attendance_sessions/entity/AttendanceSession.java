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

    /**
     * Creates an attendance session entity for JPA.
     */
    protected AttendanceSession() {}

    /**
     * Creates an attendance session entity.
     *
     * @param academicYear academic year entity
     * @param clazz class entity
     * @param sessionDate session date
     * @param session session part
     */
    public AttendanceSession(AcademicYear academicYear, Class clazz, LocalDate sessionDate, SessionPart session) {
        this.academicYear = academicYear;
        this.clazz = clazz;
        this.sessionDate = sessionDate;
        this.session = session;
    }

    /**
     * Gets the session id.
     *
     * @return session id
     */
    public Long getId() {
        return id;
    }

    /**
     * Gets the academic year entity.
     *
     * @return academic year entity
     */
    public AcademicYear getAcademicYear() {
        return academicYear;
    }

    /**
     * Gets the class entity.
     *
     * @return class entity
     */
    public Class getClazz() {
        return clazz;
    }

    /**
     * Gets the session date.
     *
     * @return session date
     */
    public LocalDate getSessionDate() {
        return sessionDate;
    }

    /**
     * Gets the session part.
     *
     * @return session part
     */
    public SessionPart getSession() {
        return session;
    }
}
